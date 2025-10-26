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

import mcpClient from "./mcpClient.js";

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
		let useMCP = process.env.ENABLE_MCP_INTEGRATION !== "false"; // Enabled by default

		// Handle generate_activities with MCP integration
		if (action === "generate_activities") {
			return await handleGenerateActivitiesWithMCP(req, res, params, CLAUDE_API_KEY, useMCP);
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

/**
 * Handle activity generation with MCP integration
 */
async function handleGenerateActivitiesWithMCP(req, res, params, CLAUDE_API_KEY, useMCP) {
	try {
		let mcpContext = {};

		// Step 1: Try to get context from MCP (if enabled)
		if (useMCP) {
			try {
				console.log("[MCP] Attempting to connect and retrieve user context...");
				await mcpClient.connect();
				mcpContext = await mcpClient.getUserContext(["preferences", "activities", "tasks"]);
				console.log("[MCP] Retrieved user context successfully");
			} catch (mcpError) {
				console.warn("[MCP] Failed to get context, continuing without MCP:", mcpError.message);
				useMCP = false; // Disable MCP for this request
			}
		}

		// Step 2: Generate activities with Claude
		const claudeRequest = buildActivityGenerationRequest({
			...params,
			mcpContext, // Pass MCP context to Claude
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

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.error?.message || response.statusText || "API error");
		}

		const data = await response.json();

		// Step 3: Parse activities from Claude's response
		const activities = parseActivitiesFromClaude(data);

		// Step 4: Enhance activities with MCP (if enabled)
		let finalActivities = activities;

		if (useMCP && activities) {
			try {
				console.log("[MCP] Enhancing activities with Interaction CO...");
				finalActivities = await mcpClient.enhanceActivities(activities, mcpContext);
				console.log("[MCP] Activities enhanced successfully");

				// Optionally inject top activities back into context
				if (finalActivities.communityOpportunities && finalActivities.communityOpportunities.length > 0) {
					const topActivity = finalActivities.communityOpportunities[0];
					await mcpClient.injectActivity(topActivity, "serve", 8);
				}
			} catch (mcpError) {
				console.warn("[MCP] Failed to enhance activities, using original:", mcpError.message);
			}
		}

		// Return enhanced activities in Claude's response format
		return res.status(200).json({
			...data,
			content: [
				{
					type: "text",
					text: JSON.stringify(finalActivities),
				},
			],
			_mcp_enhanced: useMCP,
		});
	} catch (error) {
		console.error("[MCP] Error in activity generation:", error);
		return res.status(500).json({
			error: error.message || "Internal server error",
		});
	}
}

/**
 * Parse activities from Claude's response
 */
function parseActivitiesFromClaude(claudeResponse) {
	try {
		const text = claudeResponse.content[0]?.text || "{}";
		return JSON.parse(text);
	} catch (error) {
		console.error("Failed to parse Claude response:", error);
		return {
			communityOpportunities: [],
			crisisAlerts: [],
			miniGames: [],
		};
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

	return `You are a LOCAL ACTIVITY GENERATOR for a gamified volunteering app. You MUST create activities EXCLUSIVELY based on the user's actual location.

${
	preferencesText?.includes("Location:")
		? `USER'S EXACT LOCATION (GPS Coordinates): ${preferences.location}

ABSOLUTE REQUIREMENTS - LOCATION IS PRIMARY:
1. RESEARCH the actual city/area associated with these coordinates
2. Identify REAL neighborhoods, parks, landmarks, and community centers in that area
3. Understand the LOCAL CULTURE, community values, and specific regional issues
4. Address GENUINE community needs in that specific location
5. Use AUTHENTIC neighborhood names, street areas, and local landmarks
6. Incorporate cultural events, holidays, or community traditions specific to that region
7. Reference REAL organizations, food banks, shelters, schools, or community centers that exist there
8. Consider local environmental issues (coastal pollution, urban food deserts, rural access needs, etc.)
9. Use culturally appropriate language and community terminology
10. Make ALL locations walkable or within 10 miles of the user's coordinates

GEOGRAPHIC CONTEXT MUST DETERMINE EVERYTHING:
- If in a major metro (SF, LA, NYC): Use actual neighborhoods like "Mission District", "Hollywood", "Brooklyn"
- If coastal: Beach cleanups, coastal restoration, marine conservation
- If urban: Food deserts, homelessness, urban gardens, community centers
- If rural: Agricultural support, access to services, farm-to-table
- If specific city: Research that city's unique culture and issues

NEVER generate generic activities. EVERY activity MUST be specific to this exact location.`
		: `⚠️ NO LOCATION DATA AVAILABLE - You cannot generate authentic local activities without the user's location.

If location data is missing, return a message explaining that location permission is needed.

If location IS provided, you must use REAL addresses, landmarks, and culturally relevant activities for that specific area.`
}

CRITICAL LOCATION REQUIREMENT:
- The location field in EVERY activity (communityOpportunities, crisisAlerts) MUST contain REAL addresses or landmarks
- Distances MUST be calculated from the user's coordinates
- Dates MUST consider local weather, seasons, and cultural events
- Activities MUST address actual local issues and community needs

Please generate activities in the following JSON format with COMPLETE, DYNAMIC data:

\`\`\`json
{
  "communityOpportunities": [
    {
      "id": "unique-id",
      "title": "Specific, local activity title (e.g., 'Coastal Cleanup at Ocean Beach')",
      "location": "REAL address or landmark (e.g., '1234 Beach Blvd, Mission Bay')",
      "distance": "Calculated X.X miles from user",
      "xp": 100-300,
      "duration": "X-X hours (realistic for the activity)",
      "date": "Real date within next 7 days",
      "time": "Specific time (e.g., '10:00 AM')",
      "requiresMultiple": false,
      "totalRequired": 1,
      "progressDescription": "Specific items (e.g., 'bags collected')",
      "description": "Brief context about this specific local activity"
    }
  ],
  "crisisAlerts": [
    {
      "id": "unique-id",
      "title": "Urgent local need (e.g., 'Emergency Food Distribution Needed')",
      "urgency": "high|medium|low (based on realistic severity)",
      "location": "REAL location name (e.g., 'Downtown Community Center, 567 Main St')",
      "xp": 150-400,
      "volunteers": "Realistic number (5-50)",
      "date": "Real date within next 7 days",
      "time": "Specific time or 'Immediate'",
      "requiresMultiple": false,
      "totalRequired": 1,
      "progressDescription": "Specific actions (e.g., 'meals distributed')",
      "description": "Context about this urgent local situation"
    }
  ],
  "miniGames": [
    {
      "id": "unique-id",
      "title": "Location-aware challenge (e.g., 'Clean 20 streets in your neighborhood')",
      "description": "Detailed description of the specific challenge",
      "xp": 40-100,
      "icon": "relevant emoji",
      "date": "Anytime",
      "time": "Realistic XX min",
      "requiresMultiple": true/false,
      "totalRequired": Realistic number (5-50),
      "progressDescription": "Specific measurements (e.g., 'streets cleaned')",
      "location": "Your neighborhood or city-wide"
    }
  ]
}
\`\`\`

CRITICAL: Every field must be:
- LOCATION-SPECIFIC: Use real neighborhood, street names, landmarks
- CALCULATED: Distance must be realistic based on user's GPS coordinates
- CULTURALLY RELEVANT: Address actual issues in that area
- TEMPORALLY ACCURATE: Dates/times must be realistic and within context
- SPECIFIC: No generic placeholders like "Location Name" or "Activity Title"

LOCATION-DRIVEN REQUIREMENTS (MANDATORY when location provided):
1. RESEARCH THE ACTUAL LOCATION - Use reverse geocoding to determine city, state, neighborhood
2. Use REAL neighborhood names (e.g., "Lower East Side", "Williamsburg", "Mission District", "SoMa")
3. Reference REAL parks, landmarks, community centers (use actual names from that area)
4. Address ACTUAL local issues:
   - Major cities: Homelessness, food insecurity, affordable housing, urban gardens
   - Coastal areas: Beach pollution, marine conservation, coastal restoration
   - Rural areas: Agricultural support, access to healthcare, farm-to-table programs
   - Specific regions: Research local cultural values and community needs
5. Use REAL distances calculated from GPS coordinates (e.g., "2.3 miles from your location")
6. Incorporate LOCAL cultural context (holidays, community traditions, regional issues)
7. Reference REAL organizations or use realistic organization names for that area

RANDOMIZATION:
- Vary activity TYPES while keeping location authenticity
- Include diverse local causes: environment, education, hunger, homelessness, animal welfare
- Mix single and multi-step activities
- Vary XP based on time/effort required
- Use engaging, culturally appropriate titles

Quantities:
- Generate 4 community opportunities (mix single and multi-step)
- Generate 2 crisis alerts (vary urgency levels)
- Generate 3 mini-games (environmental, social, educational themes)

QUALITY & COMPLETENESS REQUIREMENTS:
- NO EMPTY OR PLACEHOLDER CONTENT - Every field must have real, specific data
- Location MUST be a real address, park name, or landmark (not "Location Name")
- Distance MUST be calculated and realistic (not "X.X miles")
- Titles MUST be specific and descriptive (not "Activity Title")
- Dates MUST be actual dates within the next 7 days
- Times MUST be specific times (not "HH:MM")
- Durations MUST be realistic for the activity type
- XP MUST reflect the actual effort required
- Descriptions MUST provide context about why this activity matters locally
- Volunteer counts MUST be realistic for the type of activity
- Progress descriptions MUST specify units (e.g., "bags", "meals", "hours")

VALIDATION CHECKLIST:
✓ Every location field contains a real place name or address
✓ Every distance is a calculated number with "miles"
✓ Every date is a real date (e.g., "January 15", "Tomorrow")
✓ Every time is specific (e.g., "9:00 AM", "2:30 PM")
✓ Every title clearly describes the actual activity
✓ Every duration is realistic (e.g., "2-3 hours" for cleanup, "1 hour" for tutoring)
✓ XP values match the time commitment
✓ Multi-step activities have realistic totalRequired (not always 1)
✓ Progress descriptions are specific and measurable

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
