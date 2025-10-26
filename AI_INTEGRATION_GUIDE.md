# DoGood AI Integration Guide

## Overview
This guide explains the smart context sharing and AI-powered task customization system that integrates Poke, LiveKit, and Claude AI.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DoGood Frontend                        │
│  ┌──────────────┐    ┌─────────────────┐    ┌────────────┐ │
│  │ Context      │───▶│ Productivity    │    │ Self-      │ │
│  │ Service      │    │ Section         │    │ Improve    │ │
│  └──────────────┘    └─────────────────┘    └────────────┘ │
│         │                      │                     │       │
│         └──────────────────────┼─────────────────────┘       │
│                                ▼                             │
│                        Sync Context to MCP                   │
└─────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    DoGood MCP Server                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  store_user_context(session_id, context_json)        │   │
│  │  get_productivity_tasks(session_id, use_ai=True)     │   │
│  │  get_self_improvement_tasks(session_id, use_ai=True) │   │
│  │  send_poke_message(message)                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                │                             │
│                                ▼                             │
│                          Claude AI API                       │
│               (Generates personalized tasks)                 │
└─────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  LiveKit Voice Agent                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  get_productivity_suggestions(session_id)            │   │
│  │  get_self_improvement_suggestions(session_id)        │   │
│  │  send_poke_notification(message)                     │   │
│  └──────────────────────────────────────────────────────┘   │
│         Calls MCP tools for AI-personalized advice          │
└─────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                            Poke API
                  (Sends notifications to users)
```

## What Was Implemented

### 1. Smart Context Sharing
**File: `src/services/contextService.ts`**
- Added `syncToMCP()` method to push user context to MCP server
- Tracks: activities, page visits, XP, completed tasks, preferences
- Syncs automatically when voice assistant starts or tasks load

### 2. AI-Powered Task Generation
**File: `mcp-server/server.py`**

#### Enhanced MCP Tools:
- `store_user_context(session_id, context_json)` - Stores user context
- `get_productivity_tasks(session_id, use_ai=True)` - AI-customized productivity tasks
- `get_self_improvement_tasks(session_id, use_ai=True)` - AI-customized self-improvement

#### How AI Generation Works:
1. Receives user context (activities, XP, page visits, etc.)
2. Builds a context prompt for Claude AI
3. Claude generates 4 personalized tasks based on user patterns
4. Returns tasks with proper formatting (id, title, xp, category, color)
5. Gracefully falls back to default tasks if AI fails

### 3. LiveKit Voice Agent MCP Integration
**File: `voice-agent/agent.py`**
- Added `call_mcp_tool()` function to call MCP server endpoints
- Three new voice agent capabilities:
  - `get_productivity_suggestions(session_id)` - Get AI tasks via voice
  - `get_self_improvement_suggestions(session_id)` - Get AI goals via voice
  - `send_poke_notification(message)` - Send Poke messages

### 4. Frontend MCP Service
**File: `src/services/mcpService.ts`**
- `getAIProductivityTasks()` - Fetch AI-customized productivity tasks
- `getAISelfImprovementTasks()` - Fetch AI-customized self-improvement tasks
- `sendPokeNotification()` - Send Poke notifications
- `getActivitySuggestions()` - Get community service suggestions

### 5. UI Integration
**Files:**
- `src/components/ProductivitySection.tsx`
- `src/components/SelfImproveSection.tsx`

**Features:**
- ✨ Sparkle icon when AI-generated tasks are displayed
- Loading spinner while fetching AI tasks
- "AI-Personalized Tasks" vs "Suggested Tasks" heading
- Seamless fallback to default tasks
- Auto-syncs context on component mount

## Setup Instructions

### 1. Install MCP Server Dependencies
```bash
cd mcp-server
source venv/bin/activate  # or: . venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment Variables
The `.env` file has been created at `mcp-server/.env`:
```bash
# Claude API Key (for AI-powered task generation)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Poke API Configuration
POKE_API_KEY=your_poke_api_key_here

PORT=8000
ENVIRONMENT=development
```

### 3. Start MCP Server
```bash
cd mcp-server
source venv/bin/activate
python3 server.py
```

**Expected Output:**
```
Starting DoGood FastMCP server on 0.0.0.0:8000
Poke integration enabled: True
Claude AI integration enabled: True
  ✓ AI-powered task customization ACTIVE
```

### 4. Start Voice Agent (if testing voice features)
```bash
cd voice-agent
python3 -m livekit.agents
```

### 5. Start Frontend
```bash
npm run dev
```

## Testing the Integration

### Test 1: AI-Customized Productivity Tasks
1. Open the DoGood app in browser
2. Navigate to **Productivity** section
3. **Expected:**
   - Loading spinner appears briefly
   - Header changes to "AI-Personalized Tasks" with sparkle icon ✨
   - 4 tasks customized to your context appear
   - Console log: `[ProductivitySection] Loaded AI tasks:`

**What's happening behind the scenes:**
- Context syncs to MCP server with your session ID
- MCP calls Claude AI with your activity history
- Claude generates tasks relevant to your patterns
- Frontend displays AI tasks with special indicator

### Test 2: AI-Customized Self-Improvement Tasks
1. Navigate to **Self-Improve** section
2. **Expected:**
   - Loading spinner appears briefly
   - Header changes to "AI-Personalized for You" with sparkle icon ✨
   - Daily tasks and weekly goals customized to your context
   - Console log: `[SelfImproveSection] Loaded AI tasks:`

### Test 3: Voice Assistant with MCP Integration
1. Click the DoGood Companion button
2. Say: "What productivity tasks should I focus on?"
3. **Expected:**
   - Voice assistant calls MCP server
   - Gets AI-personalized suggestions
   - Responds with customized task list
   - Can send reminders via Poke

### Test 4: Context Syncing
1. Complete a few tasks to build context
2. Visit different sections (Service, Productivity, Self-Improve)
3. Open voice assistant
4. **Expected:**
   - Context automatically syncs to MCP
   - Voice assistant knows your recent activities
   - Task recommendations improve over time

## Example AI Customization Scenarios

### Scenario 1: Active User
**User Context:**
- Completed 10 tasks
- High XP (450)
- Recently visited Productivity section
- Completed "Code Review" task 2 days ago

**AI-Generated Tasks:**
```json
[
  {
    "title": "Advanced Code Architecture Review",
    "xp": 120,
    "category": "Work"
  },
  {
    "title": "Mentor Junior Developer",
    "xp": 100,
    "category": "Work"
  }
]
```

### Scenario 2: New User
**User Context:**
- 0 completed tasks
- Low XP (0)
- Just started exploring app

**AI-Generated Tasks:**
```json
[
  {
    "title": "Complete Your First Focus Session",
    "xp": 50,
    "category": "Personal"
  },
  {
    "title": "Set Up Your Daily Routine",
    "xp": 60,
    "category": "Personal"
  }
]
```

### Scenario 3: Fitness-Focused User
**User Context:**
- Recently completed "Hit the gym" multiple times
- Visited Self-Improve section frequently

**AI-Generated Tasks:**
```json
[
  {
    "title": "30-Minute Cardio Session",
    "description": "You've been crushing your gym sessions! Keep the momentum going.",
    "xp": 100,
    "icon": "Dumbbell"
  },
  {
    "title": "Meal Prep for Gains",
    "description": "Fuel your workouts with proper nutrition.",
    "xp": 80,
    "icon": "Heart"
  }
]
```

## API Endpoints

### MCP Server Tools (POST to `https://calhacks25-vhcq.onrender.com/mcp`)

#### Store User Context
```json
{
  "method": "tools/call",
  "params": {
    "name": "store_user_context",
    "arguments": {
      "session_id": "session_xyz",
      "context_json": "{...user context...}"
    }
  }
}
```

#### Get AI Productivity Tasks
```json
{
  "method": "tools/call",
  "params": {
    "name": "get_productivity_tasks",
    "arguments": {
      "session_id": "session_xyz",
      "use_ai": true,
      "max_tasks": 4
    }
  }
}
```

**Response:**
```json
{
  "content": {
    "tasks": [
      {
        "id": "ai_task_1",
        "title": "Review Q4 Strategy",
        "lastDone": "Never",
        "xp": 90,
        "category": "Work",
        "color": "#3B3766"
      }
    ],
    "ai_generated": true,
    "message": "AI-generated 4 personalized tasks"
  }
}
```

## Troubleshooting

### Issue: AI Tasks Not Generating
**Check:**
1. MCP server logs show: `✓ AI-powered task customization ACTIVE`
2. ANTHROPIC_API_KEY is set in `.env`
3. `anthropic` package is installed: `pip list | grep anthropic`

**Solution:**
```bash
cd mcp-server
source venv/bin/activate
pip install anthropic
python3 server.py
```

### Issue: Tasks Show "Using default tasks"
**Reason:** AI generation failed, using fallback

**Check:**
1. MCP server logs for error messages
2. Context is being synced: Check browser console for `[ContextService] Synced to MCP`
3. Claude API key is valid and has credits

### Issue: Voice Assistant Can't Access Tasks
**Check:**
1. Session ID is being passed correctly
2. Voice agent logs show MCP tool calls
3. MCP server is running and accessible

## Performance Notes

- **AI Generation Time:** ~2-3 seconds per request
- **Fallback:** Instant if AI fails
- **Caching:** Context stored in memory (ephemeral)
- **Rate Limits:** Claude API has rate limits, consider caching responses

## Future Enhancements

1. **Database Storage:** Replace in-memory context with persistent DB
2. **Response Caching:** Cache AI-generated tasks for 1 hour
3. **Batch Generation:** Generate multiple task sets at once
4. **User Feedback:** Learn from task completions to improve suggestions
5. **Poke Integration:** Two-way sync with Poke for habit tracking

## Files Modified

### MCP Server
- `mcp-server/server.py` - Added AI generation, context storage
- `mcp-server/requirements.txt` - Added anthropic, python-dotenv
- `mcp-server/.env` - Configuration file (created)

### Voice Agent
- `voice-agent/agent.py` - Added MCP tool calling
- `voice-agent/pyproject.toml` - Already had httpx

### Frontend
- `src/services/contextService.ts` - Added syncToMCP()
- `src/services/mcpService.ts` - New MCP API service (created)
- `src/components/ProductivitySection.tsx` - AI task loading
- `src/components/SelfImproveSection.tsx` - AI task loading
- `src/components/VoiceAssistant.tsx` - Context + session ID passing

## Summary

The system now intelligently shares context between:
- **Poke** → User habits and notifications
- **LiveKit** → Voice interactions and real-time assistance
- **Claude AI** → Intelligent task customization
- **DoGood App** → User activities and progress

All components work together to provide personalized, context-aware productivity and self-improvement suggestions! 🚀
