import logging
import json
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
    tts,
    llm,
    function_context
)
from livekit.plugins import noise_cancellation, silero

logger = logging.getLogger("agent")

load_dotenv(".env.local")

# MCP Server URL
MCP_SERVER_URL = "https://calhacks25-vhcq.onrender.com/mcp"

# MCP Tool Functions - callable by the LLM
async def call_mcp_tool(tool_name: str, arguments: dict) -> dict:
    """Call an MCP server tool and return the result"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                MCP_SERVER_URL,
                json={
                    "method": "tools/call",
                    "params": {
                        "name": tool_name,
                        "arguments": arguments
                    }
                }
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"MCP tool {tool_name} called successfully: {result}")
            return result
    except Exception as e:
        logger.error(f"Failed to call MCP tool {tool_name}: {e}")
        return {"error": str(e), "success": False}

# Define MCP-backed functions for the agent
async def get_productivity_suggestions(session_id: str) -> str:
    """Get AI-personalized productivity task suggestions from MCP server"""
    result = await call_mcp_tool("get_productivity_tasks", {
        "session_id": session_id,
        "use_ai": True,
        "max_tasks": 4
    })
    if result.get("success") is not False:
        tasks = result.get("content", {}).get("tasks", [])
        if tasks:
            task_list = "\n".join([f"- {task['title']} (+{task['xp']} XP)" for task in tasks])
            return f"Here are personalized productivity tasks:\n{task_list}"
    return "I found some great productivity tasks for you! Check your Productivity tab."

async def get_self_improvement_suggestions(session_id: str) -> str:
    """Get AI-personalized self-improvement suggestions from MCP server"""
    result = await call_mcp_tool("get_self_improvement_tasks", {
        "session_id": session_id,
        "use_ai": True
    })
    if result.get("success") is not False:
        content = result.get("content", {})
        tasks = content.get("daily_tasks", [])
        if tasks:
            task_list = "\n".join([f"- {task['title']}: {task['description']}" for task in tasks[:2]])
            return f"Self-improvement suggestions:\n{task_list}"
    return "I have personalized self-improvement tasks waiting for you!"

async def send_poke_notification(message: str) -> str:
    """Send a notification via Poke"""
    result = await call_mcp_tool("send_poke_message", {"message": message})
    if result.get("success"):
        return "Notification sent via Poke!"
    return "I'll make a note of that for you."


class Assistant(Agent):
    def __init__(self, user_context: str = "", session_id: str = "default") -> None:
        # Store session ID for MCP calls
        self.session_id = session_id

        # Build instructions with user context
        base_instructions = (
            "You are DoGood Companion, a helpful voice assistant for the DoGood app. "
            "The app helps people coordinate service, productivity, and self-improvement activities. "
            "Be encouraging, friendly, and concise. Speak no more than 3-4 sentences at a time. "
            "You will rhyme like a rapper. "
            "Help users choose between self improvement, service, and productivity based on their interests and history. "
            "\n\nYou have access to these special abilities:\n"
            "- Get personalized productivity suggestions using get_productivity_suggestions(session_id)\n"
            "- Get personalized self-improvement suggestions using get_self_improvement_suggestions(session_id)\n"
            "- Send Poke notifications using send_poke_notification(message)\n"
            "\nWhen you've helped them decide, you MUST use the 'send_nav_event' function to navigate them. "
            "When the conversation is over, you MUST use the 'send_goodbye_event' function to say goodbye."
        )

        # Add context if available
        if user_context:
            base_instructions += f"\n\nUser Context:\n{user_context}\n\nUse this context to personalize your responses and recommendations."

        super().__init__(instructions=base_instructions)

    async def process_llm_result(self, session: AgentSession, result: llm.LLMStream) -> None:
        # Check for function calls
        async for chunk in result:
            if chunk.type == llm.LLMChunkType.FUNCTION_CALL:
                # Call the function
                await self.call_function(session, chunk.function_call)
            elif chunk.type == llm.LLMChunkType.TEXT:
                # If we get text, just send it to TTS
                await session.say(chunk.text)

    def send_nav_event(self, session: AgentSession, section: str):
        """Navigate the user to a section of the app."""
        # Send a data channel message to the client to navigate
        session.send_data({
            'event': 'navigation_intent',
            'section': section
        }, "agent_dispatch")

    def send_goodbye_event(self, session: AgentSession):
        """End the conversation with the user."""
        # Send a data channel message to the client to end the conversation
        session.send_data({
            'event': 'conversation_end_intent'
        }, "agent_dispatch")

async def get_user_context(ctx: JobContext) -> tuple[str, str]:
    """Extract user context and session ID from participant metadata"""
    try:
        # Wait for a participant to join (the user)
        await ctx.wait_for_participant()

        # Get the first participant (user)
        participants = list(ctx.room.remote_participants.values())
        if not participants:
            logger.warning("No participants found")
            return "", "default"

        participant = participants[0]
        logger.info(f"Got participant: {participant.identity}")

        # Get metadata from participant
        metadata = participant.metadata
        if metadata:
            try:
                metadata_obj = json.loads(metadata)
                user_context = metadata_obj.get('userContext', '')
                session_id = metadata_obj.get('sessionId', 'default')
                if user_context:
                    logger.info(f"Got user context from metadata: {user_context[:100]}...")
                if session_id:
                    logger.info(f"Got session ID: {session_id}")
                return user_context, session_id
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse participant metadata: {metadata}")

        logger.info("No user context found in participant metadata")
        return "", "default"
    except Exception as e:
        logger.warning(f"Failed to get user context: {e}")
        return "", "default"


async def entrypoint(ctx: JobContext):
    # Connect to the room first
    await ctx.connect()

    # Get user context and session ID from participant metadata
    user_context, session_id = await get_user_context(ctx)

    vad = silero.VAD.load()
    session = AgentSession(
       # Using LiveKit Inference - included with LiveKit Cloud!
       stt="assemblyai/universal-streaming:en",
       llm="openai/gpt-4o-mini",
       tts="cartesia/sonic-2:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
       vad=vad,
       turn_detection=MultilingualModel(),
   )

    await session.start(
        agent=Assistant(user_context=user_context, session_id=session_id),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))