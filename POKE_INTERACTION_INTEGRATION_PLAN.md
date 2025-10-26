# Poke Interaction CO MCP Integration Plan

## Executive Summary

This document outlines a comprehensive plan to integrate the Poke Interaction CO MCP server into the DoGood app, enabling two-way data exchange where the MCP can both read from and inject information into the app's data structures, particularly focusing on suggested tasks and activity data.

---

## Current Architecture Analysis

### Data Structures

**1. UserContext (Primary Data Model)**
Located in: `src/services/contextService.ts`

```typescript
interface UserContext {
	sessionId: string;
	sessionStartTime: number;
	websiteContent: WebsiteContent; // Scraped page content
	pageVisits: PageVisit[]; // User navigation history
	activities: ActivityEvent[]; // User activity log
	userPreferences?: {
		interests?: string[];
		location?: string;
		causes?: string[];
		availableHours?: string;
	};
	tasksInProgress: string[];
	completedTasks: string[];
	totalXP: number;
	currentStreak: number;
}
```

**2. Serve Activities (Task Generation)**
Located in: `src/types/serve.ts`

```typescript
interface CommunityOpportunity {
	id: string;
	title: string;
	location: string;
	distance: string;
	xp: number;
	duration: string;
	date: string;
	time: string;
	requiresMultiple?: boolean;
	totalRequired?: number;
	progressDescription?: string;
	volunteersNeeded?: number;
	isVolunteerOpportunity?: boolean;
	description?: string; // NEW: Context about activity
}

interface CrisisAlert {
	/* Similar structure */
}
interface MiniGame {
	/* Similar structure */
}

interface ServeActivities {
	communityOpportunities: CommunityOpportunity[];
	crisisAlerts: CrisisAlert[];
	miniGames: MiniGame[];
}
```

**3. Context Service Methods**

- `getContext(): UserContext`
- `getContextForLLM(): string`
- `getContextForVoice(): string`
- `updatePreferences(preferences)`
- `logActivity(type, description, metadata)`
- `startTask(taskId, taskTitle)`
- `completeTask(taskId, taskTitle, xpGained)`

**4. Data Flow**

```
Frontend (React)
  ↓
ContextService (State Management)
  ↓
SessionStorage (Browser)
  ↓
LiveKit Voice Agent
  ↓
Backend API (api/claude.js)
  ↓
Claude AI (Activity Generation)
```

---

## Integration Architecture

### Option A: Direct MCP Integration (Recommended)

**Advantages:**

- ✅ Real-time bidirectional data flow
- ✅ Can modify activities as they're generated
- ✅ Direct access to user context
- ✅ No additional data transformation layer

**Disadvantages:**

- Requires MCP client setup in backend
- More complex error handling

### Option B: API Endpoint Proxy

**Advantages:**

- ✅ Simpler integration
- ✅ Existing API structure
- ✅ Better error isolation

**Disadvantages:**

- Additional latency (HTTP layer)
- One-way data flow limits real-time updates

**RECOMMENDATION: Option A (Direct MCP Integration)**

---

## Detailed Implementation Plan

### Phase 1: Backend MCP Integration

#### 1.1 Setup MCP Client in Backend

**File:** `api/mcpClient.js` (NEW)

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

class DoGoodMCPClient {
	constructor() {
		this.client = null;
		this.isConnected = false;
	}

	async connect() {
		if (this.isConnected) return;

		const transport = new StdioClientTransport({
			command: "npx",
			args: ["-y", "@poke/interaction-co"],
		});

		this.client = new Client(
			{
				name: "DoGood App",
				version: "1.0.0",
			},
			{
				capabilities: {
					tools: {},
				},
			}
		);

		await this.client.connect(transport);
		this.isConnected = true;
		console.log("[MCP] Connected to Poke Interaction CO");
	}

	async callTool(toolName, args) {
		if (!this.isConnected) await this.connect();

		try {
			const result = await this.client.callTool({
				name: toolName,
				arguments: args,
			});
			return result;
		} catch (error) {
			console.error(`[MCP] Error calling tool ${toolName}:`, error);
			throw error;
		}
	}

	// Read user context
	async getUserContext() {
		return await this.callTool("read_user_context", {});
	}

	// Inject activity into context
	async injectActivity(activity) {
		return await this.callTool("inject_activity", {
			activity: activity,
			contextType: "serve_activities",
		});
	}

	// Update task suggestions
	async updateTaskSuggestions(suggestions) {
		return await this.callTool("update_task_suggestions", {
			suggestions: suggestions,
		});
	}

	async disconnect() {
		if (this.client) {
			await this.client.close();
			this.isConnected = false;
		}
	}
}

export default new DoGoodMCPClient();
```

#### 1.2 Update Claude API Endpoint

**File:** `api/claude.js` (MODIFY)

Add MCP integration to activity generation:

```javascript
import mcpClient from "./mcpClient.js";

// In the generate_activities handler:
if (action === "generate_activities") {
	try {
		// Connect to MCP
		await mcpClient.connect();

		// Get user context for MCP
		const userContext = await mcpClient.getUserContext();

		// Generate activities with Claude
		const claudeRequest = buildActivityGenerationRequest({
			preferences,
			mcpContext: userContext, // Pass MCP context
		});

		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": CLAUDE_API_KEY,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify(claudeRequest),
		});

		const data = await response.json();
		const activities = parseActivities(data);

		// Inject activities into MCP
		await mcpClient.injectActivity(activities);

		// Allow MCP to modify/enhance activities
		const enhancedActivities = await mcpClient.callTool("enhance_activities", {
			activities: activities,
			userContext: userContext,
		});

		return res.status(200).json(enhancedActivities);
	} catch (error) {
		console.error("MCP integration error:", error);
		// Fallback to Claude-only response
		// ... existing Claude logic
	}
}
```

---

### Phase 2: MCP Tools Definition

#### 2.1 MCP Server Configuration

**File:** `mcp-server/interaction-co/server.js` (NEW)

```javascript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
	{
		name: "poke-interaction-co",
		version: "1.0.0",
	},
	{
		capabilities: {
			tools: {},
		},
	}
);

// Tool 1: Read User Context
server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: [
		{
			name: "read_user_context",
			description: "Read the current user context from DoGood app",
			inputSchema: {
				type: "object",
				properties: {
					contextTypes: {
						type: "array",
						items: { type: "string" },
						description:
							"Types of context to retrieve (page_visits, activities, preferences, tasks)",
					},
				},
			},
		},
		{
			name: "inject_activity",
			description: "Inject a new activity into the user context",
			inputSchema: {
				type: "object",
				properties: {
					activity: {
						type: "object",
						description: "Activity object to inject",
					},
					contextType: {
						type: "string",
						description: "Type of activity (serve, productivity, self_improve)",
					},
					priority: {
						type: "number",
						description: "Priority level (0-10)",
					},
				},
				required: ["activity", "contextType"],
			},
		},
		{
			name: "update_task_suggestions",
			description: "Update or enhance task suggestions based on user behavior",
			inputSchema: {
				type: "object",
				properties: {
					suggestions: {
						type: "array",
						description: "Array of task suggestions",
					},
					reasoning: {
						type: "string",
						description: "Why these suggestions were generated",
					},
				},
				required: ["suggestions"],
			},
		},
		{
			name: "enhance_activities",
			description: "Enhance activities with Interaction CO insights",
			inputSchema: {
				type: "object",
				properties: {
					activities: {
						type: "object",
						description: "Activities to enhance",
					},
					userContext: {
						type: "object",
						description: "User context for personalization",
					},
				},
				required: ["activities"],
			},
		},
	],
}));

// Implement tool handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	switch (name) {
		case "read_user_context":
			// Connect to DoGood app's sessionStorage/API
			const context = await readUserContext(args.contextTypes);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(context, null, 2),
					},
				],
			};

		case "inject_activity":
			// Insert activity into DoGood app context
			const injected = await injectActivityIntoContext(
				args.activity,
				args.contextType
			);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({ success: true, activity: injected }),
					},
				],
			};

		case "update_task_suggestions":
			// Update user's task suggestions
			const updated = await updateSuggestionsInContext(args.suggestions);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify({ success: true, updated }),
					},
				],
			};

		case "enhance_activities":
			// Use Interaction CO to enhance activities
			const enhanced = await enhanceActivitiesWithMCP(
				args.activities,
				args.userContext
			);
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(enhanced),
					},
				],
			};

		default:
			throw new Error(`Unknown tool: ${name}`);
	}
});

// Helper functions (connect to DoGood app)
async function readUserContext(contextTypes = []) {
	// Make HTTP request to DoGood app's context endpoint
	const response = await fetch("http://localhost:3001/api/context");
	const data = await response.json();

	// Filter based on requested context types
	const filtered = {};
	if (contextTypes.includes("page_visits"))
		filtered.pageVisits = data.pageVisits;
	if (contextTypes.includes("activities"))
		filtered.activities = data.activities;
	if (contextTypes.includes("preferences"))
		filtered.preferences = data.userPreferences;
	if (contextTypes.includes("tasks")) {
		filtered.tasksInProgress = data.tasksInProgress;
		filtered.completedTasks = data.completedTasks;
	}

	return filtered;
}

async function injectActivityIntoContext(activity, contextType) {
	// POST to DoGood app's activity injection endpoint
	const response = await fetch("http://localhost:3001/api/context/activity", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ activity, contextType }),
	});
	return await response.json();
}

async function enhanceActivitiesWithMCP(activities, userContext) {
	// Use Interaction CO's AI to enhance activities
	// This is where the MCP's intelligence comes in
	const enhanced = await callInteractionCO({
		activities: activities,
		userContext: userContext,
		enhancementType: "personalization",
	});

	return enhanced;
}

// Start server
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.log("Interaction CO MCP Server running on stdio");
}

main().catch(console.error);
```

---

### Phase 3: Frontend Integration

#### 3.1 Create Context API Endpoint

**File:** `api/context.js` (MODIFY - Add new endpoints)

```javascript
export default async function handler(req, res) {
	// Existing code...

	if (req.method === "POST" && req.path === "/activity") {
		const { activity, contextType } = req.body;

		// Use existing ContextService
		const { contextService } = await import(
			"../src/services/contextService.js"
		);

		// Inject activity
		contextService.logActivity(
			"activity_injected",
			activity.title || activity.description,
			{
				activity,
				contextType,
				source: "mcp",
			}
		);

		return res.status(200).json({ success: true });
	}

	// ... existing code
}
```

#### 3.2 Update ServeSection to Display Enhanced Activities

**File:** `src/components/ServeSection.tsx` (MODIFY - MINIMAL)

No changes needed! The component already displays activities from state. The MCP enhancements will happen behind the scenes.

---

### Phase 4: Data Exchange Specification

#### 4.1 Read Operations (MCP → DoGood App)

**What MCP Can Read:**

1. **User Context**

   - Recent page visits
   - Activity history
   - User preferences (interests, location, causes, availability)
   - Current tasks in progress
   - Completed tasks
   - XP and streak data

2. **Activity Data**
   - Generated activities (community opportunities, crisis alerts, mini-games)
   - Activity metadata (location, dates, XP, requirements)
   - User's interaction with activities (signed up, completed, in progress)

#### 4.2 Write Operations (MCP → DoGood App)

**What MCP Can Inject:**

1. **Enhanced Activities**

   - Add personalized tags or metadata
   - Modify activity details (location, time, requirements)
   - Add Interaction CO insights or recommendations
   - Prioritize activities based on user behavior

2. **Task Suggestions**

   - New suggested activities
   - Personalized task recommendations
   - Activity enhancement (add challenges, improve descriptions)

3. **User Preferences Updates**
   - Update interests based on interactions
   - Refine location-based preferences
   - Adjust availability based on patterns

---

## Implementation Flow

### Activity Generation Pipeline with MCP

```
1. User clicks "Refresh Activities" or opens Serve section
   ↓
2. Frontend calls: GET /api/claude?action=generate_activities
   ↓
3. Backend (claude.js):
   a. Get user preferences (including location)
   b. Connect to MCP client
   c. Read user context via MCP
   d. Generate activities with Claude
   e. Pass activities to MCP for enhancement
   f. MCP returns enhanced activities
   ↓
4. Return enhanced activities to frontend
   ↓
5. Frontend displays activities in ServeSection
   ↓
6. User interactions logged to context
   ↓
7. MCP can read interactions and adjust future suggestions
```

### Real-time Activity Enhancement

```
1. User browses activities
   ↓
2. MCP observes user behavior (via periodic context reads)
   ↓
3. MCP detects patterns (e.g., user always picks environmental activities)
   ↓
4. MCP injects new highly-relevant activities via API
   ↓
5. Frontend receives updated activity list
   ↓
6. User sees personalized activities at top of list
```

---

## Technical Requirements

### Dependencies to Add

```json
{
	"dependencies": {
		"@modelcontextprotocol/sdk": "^0.5.0",
		"@poke/interaction-co": "latest"
	}
}
```

### Environment Variables

```bash
# .env.local
MCP_SERVER_PATH=npx -y @poke/interaction-co
MCP_CONNECTION_TIMEOUT=5000
MCP_RETRY_ATTEMPTS=3
```

### Error Handling Strategy

1. **MCP Connection Failure**: Fallback to Claude-only generation
2. **MCP Tool Failure**: Log error, continue with original activities
3. **Data Validation**: Validate all injected data before saving
4. **Timeout Handling**: 5-second timeout for MCP calls

---

## Testing Strategy

### Unit Tests

1. Test MCP client connection
2. Test activity injection
3. Test context reading
4. Test error handling and fallbacks

### Integration Tests

1. End-to-end activity generation with MCP
2. Real-time activity enhancement
3. User preference updates via MCP
4. Multi-user scenario (session isolation)

---

## Security Considerations

1. **Authentication**: MCP calls authenticated via session
2. **Data Validation**: Sanitize all injected data
3. **Rate Limiting**: Limit MCP tool calls per session
4. **Privacy**: User context data only passed to MCP, never stored by MCP

---

## Rollout Plan

### Phase 1 (Week 1-2): Setup

- Install MCP dependencies
- Create MCP client wrapper
- Set up basic MCP connection

### Phase 2 (Week 3-4): Read Operations

- Implement context reading
- Add logging for MCP interactions
- Test read-only operations

### Phase 3 (Week 5-6): Write Operations

- Implement activity injection
- Add data validation
- Test bidirectional flow

### Phase 4 (Week 7-8): Enhancement

- Add activity enhancement logic
- Implement real-time updates
- Full integration testing

---

## Success Metrics

1. **MCP Integration Health**

   - Connection success rate > 99%
   - Average MCP call latency < 500ms

2. **Activity Quality**

   - User engagement with activities (click-through rate)
   - Task completion rate
   - User satisfaction (if tracked)

3. **System Performance**
   - No degradation in activity generation time
   - Frontend render performance maintained

---

## Alternative Approaches Considered

### Option 1: WebSocket Integration

- Real-time bidirectional updates
- More complex than MCP
- Overkill for current needs

### Option 2: Polling-Based Updates

- Simpler implementation
- Higher latency
- Less efficient

### Option 3: MCP + Webhook Hybrid

- Combines best of both
- More complex
- Future enhancement possibility

---

## Next Steps

1. ✅ Review this plan with team
2. **Install MCP dependencies**
3. **Create MCP client wrapper** (Phase 1)
4. **Implement read operations** (Phase 2)
5. **Implement write operations** (Phase 3)
6. **Test and refine** (Phase 4)

---

## Appendix: Data Structures

### Example: Enhanced Activity Object

```json
{
	"id": "activity_123",
	"title": "Coastal Cleanup at Ocean Beach",
	"location": "1234 Beach Blvd, Mission Bay",
	"distance": "2.3 miles",
	"xp": 250,
	"duration": "3-4 hours",
	"date": "January 15",
	"time": "9:00 AM",
	"description": "Help protect the local coastline by cleaning up debris and microplastics.",
	"requiresMultiple": true,
	"totalRequired": 20,
	"progressDescription": "bags collected",
	"_mcp_enhanced": {
		"personalization_score": 0.92,
		"recommendation_reason": "User has completed 5 environmental activities, showing strong interest",
		"similar_activities_completed": 5,
		"optimal_time": "morning",
		"community_engagement": "high"
	}
}
```

---

## Questions to Answer Before Implementation

1. **MCP Server Requirements**: What specific tools does Interaction CO provide?
2. **Data Privacy**: What user data can Interaction CO access?
3. **Activity Modification**: Can MCP modify existing activities, or only inject new ones?
4. **Conflict Resolution**: What happens if MCP and Claude generate conflicting activities?
5. **Performance Impact**: How much latency will MCP add to activity generation?

---

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Status**: Draft - Awaiting Review
