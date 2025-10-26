import logging
import json
import os
import httpx
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from dotenv import load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    RoomInputOptions,
    WorkerOptions,
    cli,
    llm,
)
from livekit.plugins import noise_cancellation, silero

logger = logging.getLogger("agent")

load_dotenv(".env.local")


class Assistant(Agent):
    def __init__(self, user_context: str = "", room=None) -> None:
        # Build instructions with user context
        base_instructions = (
            "You are DoGood Companion, a helpful voice assistant for the DoGood app. "
            "The app helps people coordinate service, productivity, and self-improvement activities. "
            "Be encouraging, friendly, and concise. Speak no more than 3-4 sentences at a time. "
            "Help users choose between self improvement, service, and productivity based on their interests and history."
        )

        # Add context if available
        if user_context:
            base_instructions += f"\n\nUser Context:\n{user_context}\n\nUse this context to personalize your responses and recommendations."

        super().__init__(instructions=base_instructions)
        
        # Track conversation for orchestration
        self.conversation_history = []
        self.user_context = user_context
        self.room = room
        self.current_page = "home"
        
        # Intent detection keywords for orchestration
        self.orchestration_keywords = [
            "show me", "navigate", "take me to", "i want to",
            "help me find", "find me", "get me", "open",
            "start", "begin", "can you", "could you"
        ]
        
        # Backend API endpoint (defaults to localhost for dev)
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:3001")
    
    def should_orchestrate(self, text: str) -> bool:
        """Check if user input suggests orchestration is needed"""
        text_lower = text.lower()
        return any(keyword in text_lower for keyword in self.orchestration_keywords)
    
    async def orchestrate_with_claude(self) -> dict:
        """Call Claude API for orchestration decisions"""
        try:
            # Build transcript from conversation history
            transcript = "\n".join([
                f"{msg['role']}: {msg['content']}" 
                for msg in self.conversation_history[-10:]  # Last 10 exchanges
            ])
            
            # Call backend orchestration endpoint
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.backend_url}/api/claude",
                    json={
                        "action": "orchestrate",
                        "transcript": transcript,
                        "userContext": self.user_context,
                        "currentPage": self.current_page
                    },
                    timeout=30.0
                )
                
                if response.status_code != 200:
                    logger.error(f"Orchestration API error: {response.status_code}")
                    return None
                
                data = response.json()
                
                # Parse Claude's response
                if not data.get("content") or not data["content"][0].get("text"):
                    logger.error("Invalid orchestration response format")
                    return None
                
                content = data["content"][0]["text"]
                
                # Extract JSON from response
                json_match = None
                if "```json" in content:
                    start = content.find("```json") + 7
                    end = content.find("```", start)
                    json_str = content[start:end].strip()
                    json_match = json_str
                elif "{" in content:
                    # Find first { and matching }
                    start = content.find("{")
                    brace_count = 0
                    end = -1
                    for i in range(start, len(content)):
                        if content[i] == "{":
                            brace_count += 1
                        elif content[i] == "}":
                            brace_count -= 1
                            if brace_count == 0:
                                end = i + 1
                                break
                    if end != -1:
                        json_match = content[start:end]
                
                if json_match:
                    commands = json.loads(json_match)
                    logger.info(f"Claude orchestration: {commands.get('intent', 'unknown')}")
                    return commands
                else:
                    logger.error("Failed to extract JSON from Claude response")
                    return None
                    
        except Exception as e:
            logger.error(f"Orchestration error: {e}")
            return None
    
    async def send_command_to_frontend(self, commands: dict):
        """Send orchestration commands to frontend via BOTH data channel AND text message"""
        if not self.room:
            logger.warning("No room available to send commands")
            return
        
        if not self.room.local_participant:
            logger.warning("No local participant available to send commands")
            return
        
        try:
            logger.info(f"[Agent] Preparing to send commands: {commands.get('intent', 'unknown')}")
            
            # Method 1: Send via data channel
            try:
                data_packet = json.dumps(commands).encode('utf-8')
                logger.info(f"[Agent] Encoded data packet: {len(data_packet)} bytes")
                
                await self.room.local_participant.publish_data(
                    data_packet,
                    reliable=True
                )
                logger.info(f"[Agent] Successfully sent commands via data channel")
            except Exception as e:
                logger.warning(f"[Agent] Data channel failed: {e}")
            
            # Method 2: Also send as text message for fallback
            try:
                nav_command = f"DOGOOD_NAV_{commands.get('navigation', {}).get('page', 'home')}"
                await self.room.local_participant.send_text(nav_command)
                logger.info(f"[Agent] Sent navigation via text: {nav_command}")
                
                # Send full JSON as another text message
                json_cmd = json.dumps(commands)
                await self.room.local_participant.send_text(f"DOGOOD_CMD_{json_cmd}")
                logger.info(f"[Agent] Sent full command via text")
            except Exception as e:
                logger.error(f"[Agent] Text message failed: {e}")
                
        except Exception as e:
            logger.error(f"[Agent] Failed to send commands to frontend: {e}")
            import traceback
            logger.error(f"[Agent] Traceback: {traceback.format_exc()}")
    
    async def on_chat_received(self, message: llm.ChatMessage):
        """Override to track conversation and trigger orchestration"""
        # Track user messages
        if message.role == "user":
            self.conversation_history.append({
                "role": "user",
                "content": message.content
            })
            
            # REAL-TIME: Send EVERY user message to Claude for analysis
            logger.info(f"Real-time transcript: {message.content}")
            commands = await self.orchestrate_with_claude()
            
            if commands:
                # Send commands to frontend immediately
                await self.send_command_to_frontend(commands)
                
                # Update current page if navigation occurred
                if commands.get("navigation"):
                    self.current_page = commands["navigation"].get("page", self.current_page)
                    logger.info(f"Orchestrated navigation to: {self.current_page}")
                
                # Use Claude's voice response if available
                voice_response = commands.get("voice_response")
                if voice_response:
                    # Add to conversation history
                    self.conversation_history.append({
                        "role": "assistant",
                        "content": voice_response
                    })
                    # This will be spoken by the TTS
                    return voice_response
        
        # Track assistant messages
        elif message.role == "assistant":
            self.conversation_history.append({
                "role": "assistant",
                "content": message.content
            })
        
        return None

async def get_user_context(ctx: JobContext) -> str:
    """Extract user context from participant metadata"""
    try:
        # Wait for a participant to join (the user)
        await ctx.wait_for_participant()

        # Get the first participant (user)
        participants = list(ctx.room.remote_participants.values())
        if not participants:
            logger.warning("No participants found")
            return ""

        participant = participants[0]
        logger.info(f"Got participant: {participant.identity}")

        # Get metadata from participant
        metadata = participant.metadata
        if metadata:
            try:
                metadata_obj = json.loads(metadata)
                user_context = metadata_obj.get('userContext', '')
                if user_context:
                    logger.info(f"Got user context from metadata: {user_context[:100]}...")
                    return user_context
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse participant metadata: {metadata}")

        logger.info("No user context found in participant metadata")
        return ""
    except Exception as e:
        logger.warning(f"Failed to get user context: {e}")
        return ""


async def entrypoint(ctx: JobContext):
    # Connect to the room first
    await ctx.connect()

    # Get user context from participant metadata
    user_context = await get_user_context(ctx)

    vad = silero.VAD.load()
    
    # Create assistant with room reference for data channel communication
    assistant = Assistant(user_context=user_context, room=ctx.room)
    
    session = AgentSession(
       # Using LiveKit Inference - included with LiveKit Cloud!
       stt="assemblyai/universal-streaming:en",
       llm="openai/gpt-4o-mini",
       tts="cartesia/sonic-2:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
       vad=vad,
       turn_detection=MultilingualModel(),
   )

    await session.start(
        agent=assistant,
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
