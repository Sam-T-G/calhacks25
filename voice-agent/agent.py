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
            "Be nice and helpful and speak no more than 4 sentences at a time"
            "Help people choose between self improvement, service, and productivity."
            "You will respond rhyming in the style of a rapper."
            , #instructions
        )

async def entrypoint(ctx: JobContext):

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
        agent=Assistant(),
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
