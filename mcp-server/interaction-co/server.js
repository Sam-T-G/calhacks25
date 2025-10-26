#!/usr/bin/env node

/**
 * Poke Interaction CO MCP Server
 *
 * This MCP server provides bidirectional data exchange between the Poke Interaction CO
 * system and the DoGood app, enabling reading from and writing to app data structures.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Configuration
const DOGOOD_API_BASE = process.env.DOGOOD_API_BASE || "http://localhost:3001/api";

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

/**
 * Define available MCP tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: [
		{
			name: "read_user_context",
			description: "Read the current user context from DoGood app (page visits, activities, preferences, tasks)",
			inputSchema: {
				type: "object",
				properties: {
					contextTypes: {
						type: "array",
						items: { type: "string" },
						description: "Types of context to retrieve: page_visits, activities, preferences, tasks. If empty, returns all.",
					},
				},
			},
		},
		{
			name: "inject_activity",
			description: "Inject a new activity into the DoGood app's activity list",
			inputSchema: {
				type: "object",
				properties: {
					activity: {
						type: "object",
						description: "Activity object with id, title, location, xp, etc.",
						required: ["id", "title", "location", "xp"],
					},
					contextType: {
						type: "string",
						enum: ["serve", "productivity", "self_improve"],
						description: "Type of activity section to inject into",
					},
					priority: {
						type: "number",
						description: "Priority level (0-10, higher = shown first)",
						minimum: 0,
						maximum: 10,
					},
				},
				required: ["activity", "contextType"],
			},
		},
		{
			name: "update_task_suggestions",
			description: "Update or enhance task suggestions based on user behavior patterns",
			inputSchema: {
				type: "object",
				properties: {
					suggestions: {
						type: "array",
						description: "Array of task suggestion objects",
					},
					reasoning: {
						type: "string",
						description: "Explanation for why these suggestions were generated",
					},
				},
				required: ["suggestions"],
			},
		},
		{
			name: "enhance_activities",
			description: "Enhance generated activities with Interaction CO AI insights and personalization",
			inputSchema: {
				type: "object",
				properties: {
					activities: {
						type: "object",
						description: "Activities object with communityOpportunities, crisisAlerts, miniGames",
					},
					userContext: {
						type: "object",
						description: "User context for personalization (preferences, history, etc.)",
					},
				},
				required: ["activities"],
			},
		},
	],
}));

/**
 * Handle tool execution requests
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;

	console.error(`[Interaction CO MCP] Executing tool: ${name}`);

	try {
		switch (name) {
			case "read_user_context":
				return await handleReadUserContext(args.contextTypes || []);

			case "inject_activity":
				return await handleInjectActivity(
					args.activity,
					args.contextType,
					args.priority || 5
				);

			case "update_task_suggestions":
				return await handleUpdateTaskSuggestions(
					args.suggestions,
					args.reasoning || ""
				);

			case "enhance_activities":
				return await handleEnhanceActivities(
					args.activities,
					args.userContext || {}
				);

			default:
				throw new Error(`Unknown tool: ${name}`);
		}
	} catch (error) {
		console.error(`[Interaction CO MCP] Error in ${name}:`, error);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({
						error: error.message,
						success: false,
					}),
				},
			],
			isError: true,
		};
	}
});

/**
 * Read user context from DoGood app
 */
async function handleReadUserContext(contextTypes) {
	try {
		// Fetch context from DoGood API
		const response = await fetch(`${DOGOOD_API_BASE}/context`);

		if (!response.ok) {
			throw new Error(`Failed to fetch context: ${response.statusText}`);
		}

		const data = await response.json();

		// Filter based on requested context types
		const filtered = {};

		if (contextTypes.length === 0) {
			// Return all context
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		}

		// Filter specific context types
		if (contextTypes.includes("page_visits")) {
			filtered.pageVisits = data.pageVisits || [];
		}
		if (contextTypes.includes("activities")) {
			filtered.activities = data.activities || [];
		}
		if (contextTypes.includes("preferences")) {
			filtered.userPreferences = data.userPreferences || {};
		}
		if (contextTypes.includes("tasks")) {
			filtered.tasksInProgress = data.tasksInProgress || [];
			filtered.completedTasks = data.completedTasks || [];
			filtered.totalXP = data.totalXP || 0;
			filtered.currentStreak = data.currentStreak || 0;
		}

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(filtered, null, 2),
				},
			],
		};
	} catch (error) {
		console.error("[Interaction CO MCP] Error reading context:", error);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({
						error: error.message,
						success: false,
					}),
				},
			],
		};
	}
}

/**
 * Inject activity into DoGood app
 */
async function handleInjectActivity(activity, contextType, priority) {
	try {
		// Add metadata to activity
		const enhancedActivity = {
			...activity,
			_mcp_enhanced: {
				injected_at: new Date().toISOString(),
				priority,
				source: "poke_interaction_co",
			},
		};

		// POST to DoGood activity injection endpoint
		const response = await fetch(`${DOGOOD_API_BASE}/context/activity`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				activity: enhancedActivity,
				contextType,
			}),
		});

		if (!response.ok) {
			throw new Error(`Failed to inject activity: ${response.statusText}`);
		}

		const result = await response.json();

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({
						success: true,
						activity: enhancedActivity,
						result,
					}),
				},
			],
		};
	} catch (error) {
		console.error("[Interaction CO MCP] Error injecting activity:", error);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({
						error: error.message,
						success: false,
					}),
				},
			],
		};
	}
}

/**
 * Update task suggestions
 */
async function handleUpdateTaskSuggestions(suggestions, reasoning) {
	try {
		// POST to DoGood suggestions endpoint
		const response = await fetch(`${DOGOOD_API_BASE}/context/suggestions`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				suggestions,
				reasoning,
				source: "poke_interaction_co",
			}),
		});

		if (!response.ok) {
			throw new Error(`Failed to update suggestions: ${response.statusText}`);
		}

		const result = await response.json();

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({
						success: true,
						updated: suggestions.length,
						result,
					}),
				},
			],
		};
	} catch (error) {
		console.error("[Interaction CO MCP] Error updating suggestions:", error);
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify({
						error: error.message,
						success: false,
					}),
				},
			],
		};
	}
}

/**
 * Enhance activities with Interaction CO AI
 */
async function handleEnhanceActivities(activities, userContext) {
	try {
		// This is where Poke Interaction CO's AI enhancement logic would go
		// For now, we'll add metadata and prioritization based on user context

		const enhanced = {
			communityOpportunities: enhanceOpportunitiesList(
				activities.communityOpportunities || [],
				userContext
			),
			crisisAlerts: enhanceCrisisAlerts(
				activities.crisisAlerts || [],
				userContext
			),
			miniGames: enhanceMiniGames(
				activities.miniGames || [],
				userContext
			),
		};

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(enhanced, null, 2),
				},
			],
		};
	} catch (error) {
		console.error("[Interaction CO MCP] Error enhancing activities:", error);
		// Return original activities on error
		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(activities, null, 2),
				},
			],
		};
	}
}

/**
 * Helper: Enhance community opportunities with personalization
 */
function enhanceOpportunitiesList(opportunities, userContext) {
	return opportunities.map((opp) => {
		// Calculate personalization score based on user preferences
		let personalizationScore = 0.5; // Base score

		const userPrefs = userContext.userPreferences || {};
		const userInterests = userPrefs.interests || [];
		const userCauses = userPrefs.causes || [];
		const completedTasks = userContext.completedTasks || [];

		// Boost score if matches user interests
		if (userInterests.length > 0) {
			const matchesInterest = userInterests.some((interest) =>
				opp.title.toLowerCase().includes(interest.toLowerCase()) ||
				(opp.description && opp.description.toLowerCase().includes(interest.toLowerCase()))
			);
			if (matchesInterest) personalizationScore += 0.2;
		}

		// Boost score if matches user causes
		if (userCauses.length > 0) {
			const matchesCause = userCauses.some((cause) =>
				opp.title.toLowerCase().includes(cause.toLowerCase()) ||
				(opp.description && opp.description.toLowerCase().includes(cause.toLowerCase()))
			);
			if (matchesCause) personalizationScore += 0.3;
		}

		// Check for similar completed activities
		const similarCompleted = completedTasks.filter((task) =>
			task.toLowerCase().includes(opp.title.split(" ")[0].toLowerCase())
		).length;

		return {
			...opp,
			_mcp_enhanced: {
				personalization_score: Math.min(personalizationScore, 1.0),
				recommendation_reason: generateRecommendationReason(
					personalizationScore,
					userInterests,
					userCauses
				),
				similar_activities_completed: similarCompleted,
				optimal_time: determineOptimalTime(userContext),
				community_engagement: personalizationScore > 0.7 ? "high" : "medium",
			},
		};
	});
}

/**
 * Helper: Enhance crisis alerts
 */
function enhanceCrisisAlerts(alerts, userContext) {
	return alerts.map((alert) => ({
		...alert,
		_mcp_enhanced: {
			urgency_boost: alert.urgency === "high",
			user_relevance: calculateRelevance(alert, userContext),
			distance_score: parseFloat(alert.distance) < 5 ? "nearby" : "distant",
		},
	}));
}

/**
 * Helper: Enhance mini games
 */
function enhanceMiniGames(games, userContext) {
	return games.map((game) => ({
		...game,
		_mcp_enhanced: {
			difficulty: "medium",
			estimated_completion: game.time,
			fun_factor: 0.8,
		},
	}));
}

/**
 * Helper: Generate recommendation reason
 */
function generateRecommendationReason(score, interests, causes) {
	if (score > 0.8) {
		return `Highly recommended based on your interests in ${interests.join(", ")}`;
	} else if (score > 0.6) {
		return `Matches your preference for ${causes.join(" and ")} activities`;
	} else {
		return "Great opportunity to try something new";
	}
}

/**
 * Helper: Determine optimal time based on user patterns
 */
function determineOptimalTime(userContext) {
	// Analyze user's activity history to determine when they're most active
	const activities = userContext.activities || [];

	if (activities.length === 0) return "morning";

	const hours = activities.map((activity) => {
		const date = new Date(activity.timestamp);
		return date.getHours();
	});

	const avgHour = hours.reduce((a, b) => a + b, 0) / hours.length;

	if (avgHour < 12) return "morning";
	if (avgHour < 17) return "afternoon";
	return "evening";
}

/**
 * Helper: Calculate relevance score
 */
function calculateRelevance(activity, userContext) {
	const prefs = userContext.userPreferences || {};
	let relevance = 0.5;

	// Location-based relevance
	if (prefs.location && activity.location.includes(prefs.location)) {
		relevance += 0.3;
	}

	// Cause-based relevance
	if (prefs.causes) {
		const matchesCause = prefs.causes.some((cause) =>
			activity.title.toLowerCase().includes(cause.toLowerCase())
		);
		if (matchesCause) relevance += 0.2;
	}

	return Math.min(relevance, 1.0);
}

/**
 * Start the MCP server
 */
async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("[Interaction CO MCP] Server running on stdio");
}

main().catch((error) => {
	console.error("[Interaction CO MCP] Fatal error:", error);
	process.exit(1);
});
