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
		} else if (action === "orchestrate") {
			claudeRequest = buildOrchestrationRequest(params);
		} else if (action === "extract_persona") {
			claudeRequest = buildPersonaExtractionRequest(params);
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

	return `You are a creative activity generator for a gamified volunteering app. Generate LOCALLY RELEVANT, CULTURALLY APPROPRIATE, and ENVIRONMENTALLY SENSITIVE activities for the user's specific location.

${
	preferencesText?.includes("Location:")
		? `USER'S CURRENT LOCATION: ${preferences.location}

CRITICAL REQUIREMENTS:
- Generate activities specific to THIS user's location (${preferences.location})
- Use REAL local landmarks, neighborhoods, and area names
- Incorporate culturally relevant issues, events, or needs for this region
- Consider local environmental concerns (coastal areas → beach cleanup, urban areas → city gardens, rural areas → agricultural volunteering)
- Use culturally appropriate language and community-appropriate activities
- Reference real local organizations, parks, or community centers when possible`
		: "User context:\n" + preferencesText ||
		  "No specific preferences - be diverse and creative."
}

IMPORTANT:
- Make each set of activities DIFFERENT from previous generations
- Use REAL local landmarks and neighborhood names
- Vary XP amounts, durations, and dates
- Include mix of single-step and multi-step activities
- Be culturally and environmentally relevant to the area

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

LOCATION-BASED REQUIREMENTS (if user location provided):
- Use REAL neighborhoods, parks, and landmarks near the user's location
- Generate activities that address LOCAL issues and concerns
- Consider local cultural events, holidays, or community needs
- Use culturally appropriate references and community terminology

RANDOMIZATION REQUIREMENTS:
- Vary ALL aspects: locations, titles, dates, times, XP amounts, durations
- Pick DIFFERENT activities each time (mix donation drives, cleanup events, tutoring, food banks, workshops, etc.)
- Include diverse causes: environment, education, hunger, homelessness, animal welfare, community, etc.
- Mix high and low XP activities
- Vary between single and multi-step activities randomly
- Use creative, engaging titles that haven't been used before

Quantities:
- Generate 4 community opportunities (mix single and multi-step)
- Generate 2 crisis alerts (vary urgency levels)
- Generate 3 mini-games (environmental, social, educational themes)

Quality:
- Use realistic local locations when user location is known
- Make dates within the next week (vary them)
- XP should reflect time/effort (100-400 for opportunities, 150-400 for alerts, 40-100 for games)
- Make multi-step activities have totalRequired between 5-50
- Include varied progress descriptions

Generate only the JSON, no additional text.`;
}

function buildOrchestrationRequest(params) {
	const { transcript, userContext, currentPage } = params;
	const prompt = buildOrchestrationPrompt(transcript, userContext, currentPage);

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

function buildOrchestrationPrompt(transcript, userContext, currentPage) {
	return `You are the orchestration brain for the DoGood app, a voice-controlled productivity, service, and self-improvement platform.

Your role is to analyze voice conversations and make decisions about:
1. Where to navigate the user
2. What actions to trigger
3. What UI updates to make
4. What preferences/context to update
5. What to say back to the user via voice

Current Context:
${userContext || "No context available"}

Current Page: ${currentPage || "home"}

Conversation Transcript:
${transcript || "No conversation yet"}

Available Capabilities:

NAVIGATION (pages):
- home: Main landing page with XP counter and category buttons
- serve: Community service opportunities, crisis alerts, and mini-games
- productivity: Focus timer, task management, productivity tracking
- self-improve: Personal development activities, habit tracking, challenges
- shop: Spend XP on rewards and items
- stats: View progress, achievements, XP history

ACTIONS (you can trigger multiple):
- generate_activities: Generate new service opportunities (when user asks to see/find volunteering)
- start_timer: Start productivity focus timer (params: { minutes: number, taskName: string })
- generate_self_improve: Generate personal development activities
- update_preferences: Update user interests/preferences
- refresh_activities: Refresh current section's activities

UI UPDATES:
- open_modal: Open a modal (values: "preferences", "stats_detail", "task_detail")
- highlight_element: Highlight UI element (values: "xp_counter", "navigation", "activities")
- show_notification: Show a toast notification (params: { message: string, type: "success"|"info" })

Analyze the conversation and respond with ONLY valid JSON in this EXACT format:

\`\`\`json
{
  "intent": "brief description of what user wants",
  "navigation": {
    "page": "page_name",
    "reason": "why navigating here"
  },
  "actions": [
    {
      "type": "action_name",
      "params": {}
    }
  ],
  "ui_updates": {
    "show_notification": {
      "message": "Brief message",
      "type": "info"
    }
  },
  "voice_response": "Natural, conversational response to speak back (2-3 sentences max)",
  "context_updates": {
    "interests": ["interest1", "interest2"],
    "causes": ["cause1"],
    "location": "city name"
  }
}
\`\`\`

Rules:
1. Be proactive - if user mentions interests, capture them in context_updates
2. Navigation is optional - only navigate if user clearly wants to see something
3. Actions should directly fulfill user's request
4. voice_response should be natural and encouraging
5. Keep responses concise and actionable
6. If user asks to see/find/show something, navigate AND trigger relevant generation
7. Extract preferences from natural conversation (e.g., "I care about the environment" → context_updates)
8. FOCUS ON ACTIONS: Instead of giving suggestions, TAKE ACTION by navigating and triggering tasks
9. If the user mentions they want to do something, immediately navigate to that section

CRITICAL: Respond with EXECUTABLE COMMANDS, not conversational advice. Your role is to CONTROL the app, not give suggestions.

Examples:
- "Show me volunteering opportunities" → navigate to serve + generate_activities (NOT "You could look at volunteering")
- "I want to be productive" → navigate to productivity (NOT "Have you tried focusing?")
- "Start a 25 minute timer for studying" → navigate to productivity + start_timer
- "I'm interested in helping animals" → update_preferences (no navigation needed)
- "What can I do to help my community?" → navigate to serve + generate_activities (NOT just suggestions)

Generate ONLY the JSON response, no other text.`;
}

function buildPersonaExtractionRequest(params) {
	const { conversation } = params;
	const prompt = buildPersonaExtractionPrompt(conversation);

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

function buildPersonaExtractionPrompt(conversation) {
	return `You are analyzing a conversation between a user and an AI assistant. Your task is to extract persona information about the user and format it as structured data.

Conversation:
${conversation}

Extract the following information if mentioned:
1. Name (if shared)
2. Causes they care about (environment, education, animals, poverty, etc.)
3. Interests
4. Skills they have or want to develop
5. Availability (weekends, evenings, flexible, etc.)
6. Goals and motivation
7. Volunteer experience level
8. Productivity style
9. Preferred activity types (hands-on, remote, team-based)

Return ONLY valid JSON in this format:
\`\`\`json
{
  "causes": ["climate change", "education"],
  "interests": ["gardening", "teaching"],
  "skills": ["communication", "organization"],
  "available_hours": "weekends",
  "motivation": "Want to make a difference in my community",
  "volunteer_experience": "some",
  "goals": ["career growth", "community impact"]
}
\`\`\`

Include ONLY fields that were explicitly mentioned or clearly implied in the conversation. Omit any fields not mentioned.
Generate ONLY the JSON, no other text.`;
}
