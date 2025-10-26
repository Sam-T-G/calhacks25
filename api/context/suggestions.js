/**
 * Task Suggestions API Endpoint
 *
 * This endpoint allows the MCP server to update task suggestions
 * based on user behavior patterns and Poke Interaction CO insights.
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
		const { suggestions, reasoning, source, sessionId } = req.body;

		if (!suggestions || !Array.isArray(suggestions)) {
			res.status(400).json({
				error: "Suggestions array is required",
			});
			return;
		}

		// Get existing context
		const context = getSession(sessionId || "default");

		if (!context) {
			res.status(404).json({ error: "Session not found" });
			return;
		}

		// Log the suggestions update as an event
		const suggestionEvent = {
			type: "suggestions_updated",
			description: `MCP updated suggestions: ${reasoning || "Pattern-based update"}`,
			timestamp: Date.now(),
			metadata: {
				suggestionsCount: suggestions.length,
				reasoning,
				source: source || "poke_interaction_co",
			},
		};

		const updatedContext = {
			...context,
			activities: [...(context.activities || []), suggestionEvent],
			mcpSuggestions: {
				suggestions,
				reasoning,
				updatedAt: Date.now(),
				source: source || "poke_interaction_co",
			},
		};

		setSession(sessionId || "default", updatedContext);

		res.status(200).json({
			success: true,
			updated: suggestions.length,
			reasoning,
		});
	} catch (error) {
		console.error("Suggestions update error:", error);
		res.status(500).json({
			error: "Internal server error",
			message: error.message,
		});
	}
}
