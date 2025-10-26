# DoGood Voice Agent Setup

This directory contains the LiveKit voice agent that powers the "DoGood Companion" feature in the main app.

## Prerequisites

- Python 3.13+
- [uv](https://docs.astral.sh/uv/) package manager

## Setup

1. **Install dependencies:**
   ```bash
   cd voice-agent
   uv sync
   ```

2. **Configure environment variables:**
   The `.env.local` file is already configured with your LiveKit credentials.

3. **Run the agent locally (console mode):**
   ```bash
   uv run agent.py console
   ```

4. **Deploy the agent:**
   ```bash
   uv run agent.py start
   ```

## Agent Configuration

The agent is configured in `agent.py` with the following:
- **STT**: Deepgram Nova-3 (via LiveKit Inference)
- **LLM**: OpenAI GPT-4o-mini (via LiveKit Inference)
- **TTS**: Cartesia Sonic-2 (via LiveKit Inference)
- **VAD**: Silero
- **Turn Detection**: Multilingual Model

All models are accessed through LiveKit Inference, so you don't need separate API keys for each provider.

## Integration with Frontend

The frontend app in the parent directory connects to this agent via:
1. User clicks "Speak with DoGood Companion" button
2. Frontend fetches a LiveKit token from `/api/livekit-token`
3. Frontend connects to LiveKit room
4. This agent joins the room and handles voice interactions
5. User clicks "End Conversation" to disconnect

## File Structure

```
voice-agent/
├── agent.py          # Main voice agent implementation
├── pyproject.toml    # Python dependencies
├── uv.lock          # Locked dependencies
├── .env.local       # LiveKit credentials (gitignored)
├── .gitignore       # Git ignore rules
├── .python-version  # Python version specification
├── README.md        # Original workshop README
└── SETUP.md         # This file
```

## Troubleshooting

- **Missing API keys**: Check that `.env.local` has your LiveKit credentials
- **Connection errors**: Ensure the agent is running before clicking the button in the frontend
- **Audio issues**: Make sure your microphone permissions are enabled in the browser
