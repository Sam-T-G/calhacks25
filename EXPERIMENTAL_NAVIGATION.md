# Experimental Real-Time Navigation Fix

## Problem

Data channel communication between voice agent and frontend wasn't working for real-time navigation.

## Solution: Dual Communication Approach

Instead of relying solely on data channels, we're now using **two methods**:

### Method 1: Data Channel (Primary)

- Sends structured JSON commands via LiveKit data channel
- More efficient for complex data

### Method 2: Text Messages (Fallback)

- Sends simple navigation commands via text messages
- Format: `DOGOOD_NAV_<page_name>`
- Also sends full JSON as: `DOGOOD_CMD_<json>`
- More reliable, simpler to debug

## Implementation

### Voice Agent (`voice-agent/agent.py`)

```python
async def send_command_to_frontend(self, commands: dict):
    # Method 1: Try data channel
    await self.room.local_participant.publish_data(
        json.dumps(commands).encode('utf-8'),
        reliable=True
    )

    # Method 2: Also send as text (fallback)
    nav_command = f"DOGOOD_NAV_{commands.get('navigation', {}).get('page', 'home')}"
    await self.room.local_participant.send_text(nav_command)

    # Send full JSON too
    json_cmd = json.dumps(commands)
    await self.room.local_participant.send_text(f"DOGOOD_CMD_{json_cmd}")
```

### Frontend (`src/components/VoiceAssistant.tsx`)

```typescript
// Listen for data channel
room.on(RoomEvent.DataReceived, handleData);

// Also monitor room events for debugging
room.on(RoomEvent.ParticipantConnected, () => {
	console.log("Participant connected");
});
```

## Testing

1. Start services:

   ```bash
   # Terminal 1
   cd voice-agent && uv run agent.py dev

   # Terminal 2
   npm run dev
   ```

2. Watch logs for:

   - `[Agent] Sent navigation via text: DOGOOD_NAV_serve`
   - `[VoiceAssistant] Data received!`
   - `[VoiceAssistant] Navigating to: serve`

3. Try these commands:
   - "Show me volunteering opportunities" → should navigate to serve
   - "Take me to productivity" → should navigate to productivity
   - "I want to improve myself" → should navigate to self-improve

## Expected Behavior

When you say a navigation command:

1. Voice agent receives transcript
2. Sends to Claude for orchestration
3. Claude returns navigation JSON
4. Voice agent sends via BOTH methods:
   - Data channel (for complex commands)
   - Text message (simple navigation)
5. Frontend receives and navigates

## Debug Tips

- Check browser console for `[VoiceAssistant]` logs
- Check terminal for `[Agent]` logs
- Look for "Sent navigation via text" messages
- Verify room connection state logs

## Next Steps

If this still doesn't work:

1. Verify `publish_data` and `send_text` methods exist on `local_participant`
2. Check if we need to use `ctx.room` instead of `self.room`
3. Try using AgentSession callbacks directly
4. Consider using shared state/websockets as backup
