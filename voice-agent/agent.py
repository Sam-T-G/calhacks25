import logging
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
)
from livekit.plugins import noise_cancellation, silero

logger = logging.getLogger("agent")

load_dotenv(".env.local")

# Context API base URL
CONTEXT_API_URL = "http://localhost:3001/api/context"


class Assistant(Agent):
    def __init__(self, user_context: str = "") -> None:
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

async def fetch_user_context(room_name: str) -> str:
    """Fetch user context from the context API based on room name"""
    try:
        # Extract session ID from room name (format: dogood-{timestamp})
        # In production, you'd get this from room metadata
        logger.info(f"Attempting to fetch context for room: {room_name}")

        # For now, try to fetch any available context
        # You could also extract sessionId from room metadata
        async with httpx.AsyncClient() as client:
            # Try to get context - in production, pass sessionId properly
            response = await client.get(f"{CONTEXT_API_URL}?sessionId=latest", timeout=5.0)

            if response.status_code == 200:
                context_data = response.json()
                logger.info(f"Fetched context successfully")

                # Format context for voice agent
                context_str = f"User has {context_data.get('totalXP', 0)} XP and completed {len(context_data.get('completedTasks', []))} tasks."

                # Add recent activities
                activities = context_data.get('activities', [])[-5:]
                if activities:
                    context_str += "\nRecent activities: " + ", ".join([a['description'] for a in activities])

                return context_str
            else:
                logger.warning(f"Context API returned {response.status_code}")
                return ""
    except Exception as e:
        logger.warning(f"Failed to fetch context: {e}")
        return ""


async def entrypoint(ctx: JobContext):
    # Fetch user context
    user_context = await fetch_user_context(ctx.room.name)

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
        agent=Assistant(user_context=user_context),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
