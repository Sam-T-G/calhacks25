import logging
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
    def __init__(self) -> None:
        super().__init__(
            instructions="You are DoGood, an app for helping people coordinate and organize their service, producitivity, and self improvement." \
            "Be nice and helpful and speak no more than 3 sentences at a time"
            "Help people choose between self improvement, service, and productivity."
            , #instructions
        )

async def entrypoint(ctx: JobContext):

    vad = silero.VAD.load()
    session = AgentSession(
       stt="deepgram/nova-3",
       llm="openai/gpt-4o-mini",
       tts="cartesia/sonic-2:a167e0f3-df7e-4d52-a9c3-f949145efdab",
       vad=vad,
       turn_detection=MultilingualModel(),
   )

    
    await session.start(
        agent=Assistant(),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
