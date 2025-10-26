import logging
import json
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


class Assistant(Agent):
    def __init__(self, user_context: str = "") -> None:
        # Build instructions with user context
        base_instructions = (
            "You are DoGood Companion, a helpful voice assistant for the DoGood app. "
            "The app helps people coordinate service, productivity, and self-improvement activities. "
            "Be encouraging, friendly, and concise. Speak no more than 3-4 sentences at a time. "
            "Help users choose between self improvement, service, and productivity based on their interests and history. "
            "When you've helped them decide, say something like 'Let me take you to the [page name] section now!' "
            "Then naturally conclude the conversation with a brief goodbye."
        )

        # Add context if available
        if user_context:
            base_instructions += f"\n\nUser Context:\n{user_context}\n\nUse this context to personalize your responses and recommendations."

        super().__init__(instructions=base_instructions)

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
