/**
 * Activity Injection API Endpoint
 *
 * This endpoint allows the MCP server to inject activities into the app's context
 * for display in the Serve section or other activity sections.
 */

// Import the shared session store
import { getSession, setSession } from "../sessionStore.js";

export default async function handler(req, res) {
	// Set CORS headers
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");

	if (req.method === "OPTIONS") {
		res.status(200).end();
		return;
	}

	if (req.method !== "POST") {
		res.status(405).json({ error: "Method not allowed" });
		return;
	}

	try {
		const { activity, contextType, sessionId } = req.body;

		if (!activity || !contextType) {
			res.status(400).json({
				error: "Activity and contextType are required",
			});
			return;
		}

		// Get existing context
		const context = getSession(sessionId || "default");

		if (!context) {
			res.status(404).json({ error: "Session not found" });
			return;
		}

		// Log the activity injection as an event
		const injectionEvent = {
			type: "activity_injected",
			description: `MCP injected: ${activity.title}`,
			timestamp: Date.now(),
			metadata: {
				activity,
				contextType,
				source: "poke_interaction_co",
			},
		};

		const updatedContext = {
			...context,
			activities: [...(context.activities || []), injectionEvent],
		};

		// Store the injected activity in a special field for MCP-injected activities
		if (!updatedContext.mcpInjectedActivities) {
			updatedContext.mcpInjectedActivities = {
				serve: [],
				productivity: [],
				self_improve: [],
			};
		}

		if (!updatedContext.mcpInjectedActivities[contextType]) {
			updatedContext.mcpInjectedActivities[contextType] = [];
		}

		updatedContext.mcpInjectedActivities[contextType].push({
			...activity,
			injectedAt: Date.now(),
		});

		setSession(sessionId || "default", updatedContext);

		res.status(200).json({
			success: true,
			activity,
			contextType,
		});
	} catch (error) {
		console.error("Activity injection error:", error);
		res.status(500).json({
			error: "Internal server error",
			message: error.message,
		});
	}
}
