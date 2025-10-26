/**
 * Backend API Proxy for Claude API
 *
 * This file creates a backend endpoint that safely calls the Claude API
 * without exposing your API key to the frontend.
 *
 * Deploy options:
 * - Vercel Serverless Function (recommended)
 * - Netlify Function
 * - Express.js server
 * - Any Node.js backend
 */

// For Vercel/Netlify Serverless Functions
export default async function handler(req, res) {
	// Only allow POST requests
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	// CORS headers
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");

	// Handle preflight
	if (req.method === "OPTIONS") {
		return res.status(200).end();
	}

	const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY;

	if (!CLAUDE_API_KEY) {
		return res.status(500).json({ error: "API key not configured" });
	}

	try {
		const { action, ...params } = req.body;

		let claudeRequest;

		if (action === "generate_activities") {
			claudeRequest = buildActivityGenerationRequest(params);
		} else if (action === "verify_photo") {
			claudeRequest = buildPhotoVerificationRequest(params);
		} else {
			return res.status(400).json({ error: "Invalid action" });
		}

		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": CLAUDE_API_KEY,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify(claudeRequest),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(
				errorData.error?.message || response.statusText || "API error"
			);
		}

		const data = await response.json();
		return res.status(200).json(data);
	} catch (error) {
		console.error("Claude API error:", error);
		return res.status(500).json({
			error: error.message || "Internal server error",
		});
	}
}

function buildActivityGenerationRequest(params) {
	const { preferences } = params;
	const prompt = buildGenerationPrompt(preferences);

	return {
		model: "claude-3-5-sonnet-20241022",
		max_tokens: 2048,
		messages: [
			{
				role: "user",
				content: prompt,
			},
		],
	};
}

function buildPhotoVerificationRequest(params) {
	const {
		photoBase64,
		taskTitle,
		taskDescription,
		isMultiStep,
		currentProgress,
		totalRequired,
	} = params;

	// Extract base64 data
	const base64Data = photoBase64.split(",")[1] || photoBase64;

	// Detect media type
	const mediaTypePrefix = photoBase64.split(",")[0] || "";
	let mediaType = "image/jpeg";
	if (mediaTypePrefix.includes("image/png")) {
		mediaType = "image/png";
	} else if (mediaTypePrefix.includes("image/webp")) {
		mediaType = "image/webp";
	}

	const verificationText = buildVerificationPrompt(
		taskTitle,
		taskDescription,
		isMultiStep,
		currentProgress,
		totalRequired
	);

	return {
		model: "claude-3-5-sonnet-20241022",
		max_tokens: 1024,
		messages: [
			{
				role: "user",
				content: [
					{
						type: "image",
						source: {
							type: "base64",
							media_type: mediaType,
							data: base64Data,
						},
					},
					{
						type: "text",
						text: verificationText,
					},
				],
			},
		],
	};
}

function buildVerificationPrompt(
	taskTitle,
	taskDescription,
	isMultiStep,
	currentProgress,
	totalRequired
) {
	if (isMultiStep) {
		// For multi-step activities, verify the ACTION type, not the quantity
		return `Please analyze this image to verify if it shows the correct type of action for this incremental task:

Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ""}
Progress: ${currentProgress}/${totalRequired} completed

IMPORTANT: This is a multi-step activity where the user needs to complete ${totalRequired} instances.
- You are verifying if this photo shows ONE instance of the correct action (not all ${totalRequired})
- If the photo shows the correct type of activity, ACCEPT it (verified: true)
- For example, for "Recycle 50 cans", accept any photo showing recycling activity, even if it's just 1 can
- For "Collect 20 donations", accept any photo showing a donation item
- Focus on verifying the ACTION TYPE, not the quantity

Respond in JSON format with:
{
  "verified": boolean (true if the image shows the correct type of action for this task),
  "confidence": number (0-1 scale of how confident you are),
  "message": string (brief encouraging message about what you see)
}

Be lenient and encouraging. If the photo shows genuine effort toward the right type of action, verify it!`;
	} else {
		// For single-completion activities, verify full completion
		return `Please analyze this image to verify if it shows completion of the following task:

Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ""}

Respond in JSON format with:
{
  "verified": boolean (true if the image clearly shows the task was completed),
  "confidence": number (0-1 scale of how confident you are),
  "message": string (brief explanation of what you see and why you verified or rejected it)
}

Be reasonable but not overly strict. If the image shows genuine effort toward completing the task, you can verify it.`;
	}
}

function buildGenerationPrompt(preferences) {
	let preferencesText = "";
	if (preferences) {
		const parts = [];
		if (preferences.interests?.length) {
			parts.push(`User interests: ${preferences.interests.join(", ")}`);
		}
		if (preferences.location) {
			parts.push(`Location: ${preferences.location}`);
		}
		if (preferences.causes?.length) {
			parts.push(`Preferred causes: ${preferences.causes.join(", ")}`);
		}
		if (preferences.availableHours) {
			parts.push(`Available hours: ${preferences.availableHours}`);
		}

		if (parts.length > 0) {
			preferencesText = `\n\nUser preferences:\n${parts.join("\n")}`;
		}
	}

	return `Generate a diverse set of community service activities for a gamified volunteering app. ${
		preferencesText ||
		"\n\nNo specific user preferences provided, so generate a diverse, interesting mix."
	}

Please generate activities in the following JSON format:

\`\`\`json
{
  "communityOpportunities": [
    {
      "id": "unique-id",
      "title": "Activity Title",
      "location": "Specific Location Name",
      "distance": "X.X miles",
      "xp": 100-300,
      "duration": "X hours",
      "date": "Month Day",
      "time": "HH:MM AM/PM",
      "requiresMultiple": false,
      "totalRequired": 1,
      "progressDescription": "items collected"
    }
  ],
  "crisisAlerts": [
    {
      "id": "unique-id",
      "title": "Urgent Need Title",
      "urgency": "high|medium|low",
      "location": "Location Name",
      "xp": 150-400,
      "volunteers": 10-50,
      "date": "Month Day",
      "time": "HH:MM AM/PM or Immediate",
      "requiresMultiple": false,
      "totalRequired": 1,
      "progressDescription": "tasks completed"
    }
  ],
  "miniGames": [
    {
      "id": "unique-id",
      "title": "Game Title",
      "description": "Brief description of the challenge",
      "xp": 40-100,
      "icon": "emoji",
      "date": "Anytime",
      "time": "XX min",
      "requiresMultiple": false,
      "totalRequired": 1,
      "progressDescription": "actions completed"
    }
  ]
}
\`\`\`

Requirements:
- Generate 4 community opportunities
- Generate 2 crisis alerts (make them realistic and relevant)
- Generate 3 mini-games (make them fun, achievable challenges)
- Make activities diverse and interesting
- Use realistic locations and times
- Make dates within the next week
- XP should reflect time/effort required
- Be creative with mini-game ideas (environmental, social, educational)

Progress Tracking:
- For activities that are repeatable (like "Recycle 20 cans"), set requiresMultiple: true, totalRequired: 20, and progressDescription: "cans recycled"
- For one-time activities, set requiresMultiple: false and totalRequired: 1
- Examples of multi-step activities: collecting items, serving meals, planting trees, etc.
- Make at least 1-2 activities in each category use progress tracking

Generate only the JSON, no additional text.`;
}
