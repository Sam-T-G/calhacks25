# Poke Interaction CO MCP Implementation - Complete Guide

## ✅ Implementation Status: COMPLETE

This document provides a comprehensive guide to the Poke Interaction CO MCP integration that has been implemented in the DoGood app.

---

## 🎯 What Has Been Implemented

### 1. MCP Client (Backend Integration)
**File:** `/api/mcpClient.js`

A robust MCP client that connects to the Poke Interaction CO server with:
- ✅ Automatic connection management
- ✅ Retry logic with configurable attempts
- ✅ Connection timeout handling
- ✅ Health check functionality
- ✅ Four core methods:
  - `getUserContext(contextTypes)` - Read user data from app
  - `injectActivity(activity, contextType, priority)` - Inject activities
  - `updateTaskSuggestions(suggestions, reasoning)` - Update suggestions
  - `enhanceActivities(activities, userContext)` - Enhance with AI

### 2. MCP Server (Poke Interaction CO Tools)
**File:** `/mcp-server/interaction-co/server.js`

A complete MCP server implementing four bidirectional tools:

#### Tool 1: `read_user_context`
- Reads user context from DoGood app
- Supports filtering by context type (preferences, activities, tasks, page_visits)
- Returns JSON with requested data

#### Tool 2: `inject_activity`
- Injects new activities into app context
- Supports serve, productivity, and self_improve sections
- Adds priority-based sorting
- Logs injection events

#### Tool 3: `update_task_suggestions`
- Updates task suggestions based on user behavior
- Includes reasoning for transparency
- Logs suggestion updates

#### Tool 4: `enhance_activities`
- AI-powered activity enhancement
- Adds personalization scores
- Calculates relevance based on user preferences
- Provides recommendation reasons
- Determines optimal time based on user patterns

### 3. Enhanced Claude API Integration
**File:** `/api/claude.js`

The Claude API endpoint now:
- ✅ Connects to MCP before generating activities
- ✅ Retrieves user context from MCP
- ✅ Passes context to Claude for better generation
- ✅ Enhances Claude's output with MCP AI
- ✅ Injects top activities back into context
- ✅ Graceful fallback if MCP unavailable
- ✅ Environment variable toggle (`ENABLE_MCP_INTEGRATION`)

### 4. API Endpoints for Activity Injection
**Files:**
- `/api/context/activity.js` - Activity injection endpoint
- `/api/context/suggestions.js` - Suggestions update endpoint
- `/api/sessionStore.js` - Shared session storage

These endpoints allow MCP to:
- Inject activities into user's context
- Update task suggestions
- Log all MCP interactions
- Store MCP-enhanced data separately

### 5. Package Dependencies
**File:** `/package.json`

Added:
- `@modelcontextprotocol/sdk`: ^0.5.0

---

## 🔄 Data Flow

### Activity Generation with MCP

```
1. User clicks "Generate Activities" in Serve section
   ↓
2. Frontend → POST /api/claude { action: "generate_activities" }
   ↓
3. Backend (claude.js):
   a. Connect to MCP client
   b. Call getUserContext() to read user preferences, activities, tasks
   c. Pass context to Claude AI
   d. Claude generates activities based on enriched context
   ↓
4. MCP Enhancement:
   a. Call enhanceActivities() with generated activities
   b. MCP calculates personalization scores
   c. Adds recommendation reasons
   d. Sorts by relevance
   e. Injects top activity into context
   ↓
5. Return enhanced activities to frontend
   ↓
6. Frontend displays activities with _mcp_enhanced metadata
```

### Bidirectional Context Sharing

```
MCP Server (Poke Interaction CO)
        ↕ (stdio transport)
MCP Client (api/mcpClient.js)
        ↕ (function calls)
Claude API Endpoint
        ↕ (HTTP)
Frontend (React)
        ↕ (Session Storage)
Context Service
```

---

## 📋 Environment Variables

Add these to `.env.local` and Vercel:

```bash
# MCP Integration
ENABLE_MCP_INTEGRATION=true
MCP_SERVER_PATH=node
MCP_SERVER_ARGS=mcp-server/interaction-co/server.js
MCP_CONNECTION_TIMEOUT=5000
MCP_RETRY_ATTEMPTS=3

# API Base URL (for MCP server to call back)
DOGOOD_API_BASE=http://localhost:3001/api
```

For production (Vercel):
```bash
DOGOOD_API_BASE=https://your-app.vercel.app/api
```

---

## 🚀 Installation & Setup

### Step 1: Install Dependencies

```bash
# Install MCP SDK
npm install @modelcontextprotocol/sdk

# Install MCP server dependencies
cd mcp-server/interaction-co
npm install
cd ../..
```

### Step 2: Configure Environment

Create or update `.env.local`:
```bash
ENABLE_MCP_INTEGRATION=true
MCP_SERVER_PATH=node
MCP_SERVER_ARGS=mcp-server/interaction-co/server.js
DOGOOD_API_BASE=http://localhost:3001/api
```

### Step 3: Test MCP Server

```bash
# Test the MCP server standalone
cd mcp-server/interaction-co
npm start
```

Expected output:
```
[Interaction CO MCP] Server running on stdio
```

### Step 4: Test Full Integration

```bash
# Start development server
npm run dev
```

1. Navigate to Serve section
2. Click "Find Activities"
3. Check browser console for MCP logs:
   - `[MCP] Attempting to connect...`
   - `[MCP] Retrieved user context successfully`
   - `[MCP] Activities enhanced successfully`

---

## 🔍 Testing the Integration

### Test 1: Basic MCP Connection

```javascript
// In browser console
fetch('/api/claude', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'generate_activities',
    preferences: {
      location: '37.7749,-122.4194', // San Francisco
      interests: ['environment', 'community'],
      causes: ['climate change']
    }
  })
})
.then(r => r.json())
.then(data => {
  console.log('MCP Enhanced:', data._mcp_enhanced);
  console.log('Activities:', JSON.parse(data.content[0].text));
});
```

### Test 2: Check Enhanced Metadata

Generated activities should have `_mcp_enhanced` metadata:

```json
{
  "id": "activity_123",
  "title": "Beach Cleanup",
  "_mcp_enhanced": {
    "personalization_score": 0.85,
    "recommendation_reason": "Highly recommended based on your interests in environment, community",
    "similar_activities_completed": 2,
    "optimal_time": "morning",
    "community_engagement": "high"
  }
}
```

### Test 3: Verify Context Reading

The MCP should be able to read user context:

```bash
# Check MCP server logs
tail -f mcp-server/interaction-co/server.log

# Should see:
[Interaction CO MCP] Executing tool: read_user_context
[Interaction CO MCP] Executing tool: enhance_activities
```

---

## 📊 Enhanced Activity Structure

### Before MCP Enhancement
```json
{
  "id": "cleanup_1",
  "title": "Beach Cleanup",
  "location": "Ocean Beach",
  "xp": 150,
  "distance": "2.3 miles"
}
```

### After MCP Enhancement
```json
{
  "id": "cleanup_1",
  "title": "Beach Cleanup",
  "location": "Ocean Beach",
  "xp": 150,
  "distance": "2.3 miles",
  "_mcp_enhanced": {
    "personalization_score": 0.92,
    "recommendation_reason": "User has completed 5 environmental activities",
    "similar_activities_completed": 5,
    "optimal_time": "morning",
    "community_engagement": "high"
  }
}
```

---

## 🛠️ Architecture Details

### MCP Client Architecture

```javascript
DoGoodMCPClient
├── connect()          // Establish stdio transport
├── callTool()         // Execute MCP tool with retry
├── getUserContext()   // Read app context
├── injectActivity()   // Inject new activity
├── updateTaskSuggestions()  // Update suggestions
├── enhanceActivities()      // AI enhancement
├── disconnect()       // Clean shutdown
└── healthCheck()      // Connection health
```

### MCP Server Tools

```javascript
Poke Interaction CO Server
├── read_user_context
│   ├── Fetch from /api/context
│   ├── Filter by contextTypes
│   └── Return JSON
├── inject_activity
│   ├── Add _mcp_enhanced metadata
│   ├── POST to /api/context/activity
│   └── Log injection event
├── update_task_suggestions
│   ├── POST to /api/context/suggestions
│   └── Store with reasoning
└── enhance_activities
    ├── Calculate personalization scores
    ├── Generate recommendation reasons
    ├── Determine optimal times
    └── Add engagement metrics
```

---

## 🔒 Security Considerations

### 1. Data Validation
- All injected activities are validated
- Session IDs are required
- Context types are restricted to known values

### 2. Rate Limiting
- MCP calls have timeout limits (5s default)
- Retry attempts are capped (3 attempts)
- Connection pooling prevents resource exhaustion

### 3. Privacy
- User context is only passed to MCP, never stored by MCP
- Session data is ephemeral (24-hour TTL)
- MCP server runs in isolated process

### 4. Error Handling
- Graceful fallback if MCP unavailable
- Original activities returned if enhancement fails
- All errors logged for debugging

---

## 🐛 Troubleshooting

### Issue: MCP Connection Fails

**Symptoms:**
- Console shows: `[MCP] Connection failed`
- Activities generated without `_mcp_enhanced`

**Solutions:**
1. Check MCP server is installed:
   ```bash
   cd mcp-server/interaction-co && npm install
   ```

2. Verify environment variables:
   ```bash
   echo $ENABLE_MCP_INTEGRATION  # Should be 'true'
   ```

3. Test MCP server standalone:
   ```bash
   node mcp-server/interaction-co/server.js
   ```

### Issue: Activities Not Enhanced

**Symptoms:**
- Activities load but no `_mcp_enhanced` metadata
- Console shows: `[MCP] Failed to enhance activities`

**Solutions:**
1. Check API endpoint is accessible:
   ```bash
   curl http://localhost:3001/api/context?sessionId=test
   ```

2. Verify session exists:
   - User must have interacted with app to create session
   - Check sessionStorage in browser DevTools

3. Check MCP server logs:
   ```bash
   # Enable verbose logging
   export DEBUG=mcp:*
   node mcp-server/interaction-co/server.js
   ```

### Issue: Injected Activities Not Appearing

**Symptoms:**
- MCP reports success but activities don't show in UI

**Solutions:**
1. Check session ID matches:
   ```javascript
   // In browser console
   localStorage.getItem('dogood_user_context')
   ```

2. Verify endpoint is working:
   ```bash
   curl -X POST http://localhost:3001/api/context/activity \
     -H "Content-Type: application/json" \
     -d '{"activity":{"id":"test"},"contextType":"serve","sessionId":"test"}'
   ```

3. Check React component is reading injected activities:
   - ServeSection should check `context.mcpInjectedActivities`

---

## 📈 Performance Metrics

### Expected Latencies

- MCP Connection: ~100-200ms (first time)
- getUserContext: ~50-100ms
- enhanceActivities: ~200-500ms
- Total overhead: ~300-800ms per request

### Optimization Tips

1. **Connection Pooling:**
   - MCP client maintains persistent connection
   - Reduces connection overhead on subsequent calls

2. **Caching:**
   - Consider caching enhanced activities for 5 minutes
   - Cache user context reads for 30 seconds

3. **Async Enhancement:**
   - Activities can be displayed immediately
   - Enhancement can happen in background

---

## 🔮 Future Enhancements

### Phase 2 (Recommended)

1. **Real-time Updates:**
   - WebSocket integration for live activity updates
   - Push notifications via Poke when new activities injected

2. **ML-Based Personalization:**
   - Train model on user behavior
   - Predict activity preferences
   - Auto-generate personalized schedules

3. **Collaborative Filtering:**
   - Recommend activities based on similar users
   - Community-driven suggestions

4. **Analytics Dashboard:**
   - Track MCP enhancement effectiveness
   - A/B test personalization scores
   - Monitor user engagement with MCP-enhanced activities

---

## 📝 API Reference

### MCP Client Methods

#### `getUserContext(contextTypes)`
```javascript
const context = await mcpClient.getUserContext(['preferences', 'tasks']);
// Returns: { userPreferences: {...}, tasksInProgress: [...], completedTasks: [...] }
```

#### `injectActivity(activity, contextType, priority)`
```javascript
await mcpClient.injectActivity(
  { id: '123', title: 'Beach Cleanup', xp: 150 },
  'serve',
  8  // High priority
);
// Returns: { success: true, activity: {...} }
```

#### `enhanceActivities(activities, userContext)`
```javascript
const enhanced = await mcpClient.enhanceActivities(
  { communityOpportunities: [...], crisisAlerts: [...] },
  { userPreferences: {...}, completedTasks: [...] }
);
// Returns: Enhanced activities with _mcp_enhanced metadata
```

---

## ✅ Implementation Checklist

- [x] Install @modelcontextprotocol/sdk dependency
- [x] Create MCP client wrapper (api/mcpClient.js)
- [x] Create MCP server (mcp-server/interaction-co/server.js)
- [x] Implement read_user_context tool
- [x] Implement inject_activity tool
- [x] Implement update_task_suggestions tool
- [x] Implement enhance_activities tool
- [x] Integrate MCP with Claude API endpoint
- [x] Create activity injection endpoint
- [x] Create suggestions update endpoint
- [x] Add shared session store
- [x] Add environment variable configuration
- [x] Implement error handling and fallbacks
- [x] Add comprehensive documentation
- [ ] **TODO:** Test with real Poke Interaction CO server
- [ ] **TODO:** Deploy to production with environment variables
- [ ] **TODO:** Monitor MCP performance metrics

---

## 🎓 Learning Resources

- [MCP SDK Documentation](https://github.com/anthropics/mcp-sdk)
- [Poke API Documentation](https://poke.com/docs)
- [DoGood App Architecture](./README.md)

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Status:** Implementation Complete - Ready for Testing
