import { ServeActivities, UserPreferences } from "../types/serve";
import { contextService } from "./contextService";

// Always use backend proxy for Claude API calls
const API_ENDPOINT = "/api/claude";
const CLAUDE_API_KEY = (import.meta as any).env?.VITE_ANTHROPIC_API_KEY;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

interface ClaudeMessage {
	role: "user" | "assistant";
	content: string | Array<{ type: string; source?: any; text?: string }>;
}

export class ClaudeService {
	private apiKey: string;

	constructor() {
		this.apiKey = CLAUDE_API_KEY || "";
		if (!this.apiKey) {
			console.info(
				"Claude API key not found in frontend. Using backend proxy or mock data."
			);
		}
	}

	/**
	 * Generate serve activities based on user preferences
	 */
	async generateServeActivities(
		preferences?: UserPreferences
	): Promise<ServeActivities> {
		// Always use backend proxy
		return this.generateViaBackend(preferences);
	}

	private async _generateViaDirectAPI(
		preferences?: UserPreferences
	): Promise<ServeActivities> {
		const prompt = this.buildGenerationPrompt(preferences);

		try {
			const response = await fetch(CLAUDE_API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": this.apiKey,
					"anthropic-version": "2023-06-01",
				},
				body: JSON.stringify({
					model: "claude-3-5-sonnet-20241022",
					max_tokens: 2048,
					messages: [
						{
							role: "user",
							content: prompt,
						},
					],
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				const errorMessage =
					errorData.error?.message || response.statusText || "Unknown error";
				console.error(
					"Claude API error for activity generation:",
					errorMessage
				);
				throw new Error(`Claude API error: ${errorMessage}`);
			}

			const data = await response.json();

			// Validate response structure
			if (!data.content || !data.content[0] || !data.content[0].text) {
				throw new Error("Invalid response format from Claude API");
			}

			const content = data.content[0].text;

			// Parse the JSON response with better error handling
			const jsonMatch =
				content.match(/```json\n([\s\S]*?)\n```/) ||
				content.match(/\{[\s\S]*?\}/);

			if (jsonMatch) {
				const jsonStr = jsonMatch[1] || jsonMatch[0];
				try {
					const activities = JSON.parse(jsonStr);

					// Validate the structure
					if (
						!activities.communityOpportunities ||
						!activities.crisisAlerts ||
						!activities.miniGames
					) {
						throw new Error("Invalid activities structure");
					}

					return activities as ServeActivities;
				} catch (parseError) {
					console.error("Failed to parse activities JSON:", parseError);
					console.warn("Falling back to mock activities");
					return this.getMockActivities();
				}
			}

			console.warn(
				"No valid JSON found in Claude response, using mock activities"
			);
			return this.getMockActivities();
		} catch (error) {
			console.error("Error generating activities:", error);
			return this.getMockActivities();
		}
	}

	/**
	 * Verify if a photo shows completion of the specified task
	 */
	async verifyPhotoCompletion(
		photoBase64: string,
		taskTitle: string,
		taskDescription?: string,
		isMultiStep: boolean = false,
		currentProgress: number = 0,
		totalRequired: number = 1
	): Promise<{ verified: boolean; confidence: number; message: string }> {
		// Always use backend proxy
		return this.verifyViaBackend(
			photoBase64,
			taskTitle,
			taskDescription,
			isMultiStep,
			currentProgress,
			totalRequired
		);
	}

	private async _verifyViaDirectAPI(
		photoBase64: string,
		taskTitle: string,
		taskDescription?: string,
		isMultiStep: boolean = false,
		currentProgress: number = 0,
		totalRequired: number = 1
	): Promise<{ verified: boolean; confidence: number; message: string }> {
		try {
			// Extract the base64 data and detect media type
			const [mediaTypePrefix, base64Data] = photoBase64.includes(",")
				? [photoBase64.split(",")[0], photoBase64.split(",")[1]]
				: ["", photoBase64];

			// Detect the actual image type from the data URL
			let mediaType = "image/jpeg"; // default
			if (mediaTypePrefix.includes("image/png")) {
				mediaType = "image/png";
			} else if (mediaTypePrefix.includes("image/webp")) {
				mediaType = "image/webp";
			} else if (mediaTypePrefix.includes("image/gif")) {
				mediaType = "image/gif";
			}

			// Validate base64 data exists
			if (!base64Data || base64Data.length === 0) {
				throw new Error("Invalid image data");
			}

			// Check if image is too large (Claude has limits)
			const imageSizeKB = (base64Data.length * 3) / 4 / 1024;
			if (imageSizeKB > 5000) {
				// 5MB limit
				return {
					verified: false,
					confidence: 0,
					message:
						"Image is too large. Please use a smaller image (under 5MB).",
				};
			}

			const response = await fetch(CLAUDE_API_URL, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-api-key": this.apiKey,
					"anthropic-version": "2023-06-01",
				},
				body: JSON.stringify({
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
									text: this.buildVerificationPrompt(
										taskTitle,
										taskDescription,
										isMultiStep,
										currentProgress,
										totalRequired
									),
								},
							],
						},
					],
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				const errorMessage =
					errorData.error?.message || response.statusText || "Unknown error";
				throw new Error(`Claude API error: ${errorMessage}`);
			}

			const data = await response.json();

			// Validate response structure
			if (!data.content || !data.content[0] || !data.content[0].text) {
				throw new Error("Invalid response format from Claude API");
			}

			const content = data.content[0].text;

			// Parse the JSON response with better error handling
			const jsonMatch =
				content.match(/```json\n([\s\S]*?)\n```/) ||
				content.match(/\{[\s\S]*?\}/);

			if (jsonMatch) {
				const jsonStr = jsonMatch[1] || jsonMatch[0];
				try {
					const result = JSON.parse(jsonStr);

					// Validate the response has required fields
					if (
						typeof result.verified !== "boolean" ||
						typeof result.confidence !== "number" ||
						typeof result.message !== "string"
					) {
						throw new Error("Invalid verification result format");
					}

					return result;
				} catch (parseError) {
					console.error("Failed to parse verification JSON:", parseError);
					throw new Error("Failed to parse verification result");
				}
			}

			// If no JSON found, try to determine if it's a verification anyway
			console.warn("No JSON found in Claude response:", content);
			throw new Error("Failed to parse verification from Claude response");
		} catch (error) {
			console.error("Error verifying photo:", error);

			// Provide more specific error messages
			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";

			if (errorMessage.includes("API key")) {
				return {
					verified: false,
					confidence: 0,
					message: "API key error. Please check your configuration.",
				};
			} else if (errorMessage.includes("rate limit")) {
				return {
					verified: false,
					confidence: 0,
					message: "Rate limit exceeded. Please wait a moment and try again.",
				};
			} else if (errorMessage.includes("too large")) {
				return {
					verified: false,
					confidence: 0,
					message: "Image is too large. Please use a smaller image.",
				};
			} else if (errorMessage.includes("Invalid image")) {
				return {
					verified: false,
					confidence: 0,
					message: "Invalid image data. Please try taking another photo.",
				};
			}

			return {
				verified: false,
				confidence: 0,
				message:
					"Could not verify photo at this time. Please try again in a moment.",
			};
		}
	}

	private buildGenerationPrompt(preferences?: UserPreferences): string {
		const basePrompt = `Generate a diverse set of community service activities for a gamified volunteering app. `;

		// Get user context for personalization
		const userContext = contextService.getContextForLLM();

		let preferencesText = "";
		if (preferences) {
			const parts: string[] = [];
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

		// Add context section
		const contextSection = userContext ? `\n\n${userContext}\n` : "";

		return `${basePrompt}${
			preferencesText ||
			"\n\nNo specific user preferences provided, so generate a diverse, interesting mix."
		}${contextSection}

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
      "time": "HH:MM AM/PM"
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
      "time": "HH:MM AM/PM or Immediate"
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
      "time": "XX min"
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

Generate only the JSON, no additional text.`;
	}

	/**
	 * Generate activities via backend API proxy
	 */
	private async generateViaBackend(
		preferences?: UserPreferences
	): Promise<ServeActivities> {
		try {
			const response = await fetch(API_ENDPOINT!, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					action: "generate_activities",
					preferences,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error("Backend error response:", errorText);
				throw new Error(`Backend API error: ${response.statusText}`);
			}

			const data = await response.json();
			console.log("Backend response:", data);

			// Parse Claude's response
			if (!data.content || !data.content[0] || !data.content[0].text) {
				console.error("Invalid response structure:", data);
				throw new Error("Invalid response format from backend");
			}

			const content = data.content[0].text;
			console.log("Claude response text:", content);

			// First try to extract JSON from code blocks
			let jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

			// If no code block, try to find the JSON object
			// Use a more robust approach: find the first { and count braces to find matching }
			if (!jsonMatch) {
				const firstBrace = content.indexOf("{");
				if (firstBrace !== -1) {
					let braceCount = 0;
					let endIndex = -1;

					for (let i = firstBrace; i < content.length; i++) {
						if (content[i] === "{") braceCount++;
						if (content[i] === "}") braceCount--;
						if (braceCount === 0) {
							endIndex = i + 1;
							break;
						}
					}

					if (endIndex !== -1) {
						const jsonStr = content.substring(firstBrace, endIndex);
						jsonMatch = [jsonStr, jsonStr]; // Fake match array
					}
				}
			}

			if (jsonMatch) {
				const jsonStr = jsonMatch[1] || jsonMatch[0];
				console.log("Extracted JSON string:", jsonStr);

				// Try to parse and provide better error message
				try {
					const activities = JSON.parse(jsonStr);

					if (
						!activities.communityOpportunities ||
						!activities.crisisAlerts ||
						!activities.miniGames
					) {
						throw new Error("Invalid activities structure");
					}

					console.log("Successfully parsed activities:", activities);
					return activities as ServeActivities;
				} catch (parseError) {
					console.error("JSON parse error:", parseError);
					console.error("Attempted to parse:", jsonStr);
					throw parseError;
				}
			}

			throw new Error("Failed to parse activities from backend response");
		} catch (error) {
			console.error("Error generating activities via backend:", error);
			console.info("Falling back to mock data");
			return this.getMockActivities();
		}
	}

	/**
	 * Verify photo via backend API proxy
	 */
	private async verifyViaBackend(
		photoBase64: string,
		taskTitle: string,
		taskDescription?: string,
		isMultiStep: boolean = false,
		currentProgress: number = 0,
		totalRequired: number = 1
	): Promise<{ verified: boolean; confidence: number; message: string }> {
		try {
			const response = await fetch(API_ENDPOINT!, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					action: "verify_photo",
					photoBase64,
					taskTitle,
					taskDescription,
					isMultiStep,
					currentProgress,
					totalRequired,
				}),
			});

			if (!response.ok) {
				throw new Error(`Backend API error: ${response.statusText}`);
			}

			const data = await response.json();

			// Parse Claude's response
			if (!data.content || !data.content[0] || !data.content[0].text) {
				throw new Error("Invalid response format from backend");
			}

			const content = data.content[0].text;

			// First try to extract JSON from code blocks
			let jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);

			// If no code block, use brace counting to find complete JSON
			if (!jsonMatch) {
				const firstBrace = content.indexOf("{");
				if (firstBrace !== -1) {
					let braceCount = 0;
					let endIndex = -1;

					for (let i = firstBrace; i < content.length; i++) {
						if (content[i] === "{") braceCount++;
						if (content[i] === "}") braceCount--;
						if (braceCount === 0) {
							endIndex = i + 1;
							break;
						}
					}

					if (endIndex !== -1) {
						const jsonStr = content.substring(firstBrace, endIndex);
						jsonMatch = [jsonStr, jsonStr];
					}
				}
			}

			if (jsonMatch) {
				const jsonStr = jsonMatch[1] || jsonMatch[0];
				const result = JSON.parse(jsonStr);

				if (
					typeof result.verified !== "boolean" ||
					typeof result.confidence !== "number" ||
					typeof result.message !== "string"
				) {
					throw new Error("Invalid verification result format");
				}

				return result;
			}

			throw new Error("Failed to parse verification from backend response");
		} catch (error) {
			console.error("Error verifying photo via backend:", error);
			return {
				verified: false,
				confidence: 0,
				message:
					"Could not verify photo at this time. Please try again in a moment.",
			};
		}
	}

	private buildVerificationPrompt(
		taskTitle: string,
		taskDescription: string | undefined,
		isMultiStep: boolean,
		currentProgress: number,
		totalRequired: number
	): string {
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

	private getMockActivities(): ServeActivities {
		return {
			communityOpportunities: [
				{
					id: "1",
					title: "Collect Donations for Food Bank",
					location: "Downtown Community Center",
					distance: "0.8 miles",
					xp: 200,
					duration: "15 min per item",
					date: "Dec 28",
					time: "9:00 AM",
					requiresMultiple: true,
					totalRequired: 20,
					progressDescription: "items donated",
				},
				{
					id: "2",
					title: "Park Cleanup",
					location: "Riverside Park",
					distance: "1.2 miles",
					xp: 100,
					duration: "2 hours",
					date: "Dec 29",
					time: "10:00 AM",
				},
				{
					id: "3",
					title: "Tutor Students",
					location: "Lincoln Elementary",
					distance: "2.1 miles",
					xp: 200,
					duration: "4 hours",
					date: "Dec 30",
					time: "2:00 PM",
				},
				{
					id: "4",
					title: "Recycle Cans & Bottles",
					location: "City Recycling Center",
					distance: "3.5 miles",
					xp: 250,
					duration: "5 min per can",
					date: "Dec 31",
					time: "11:00 AM",
					requiresMultiple: true,
					totalRequired: 50,
					progressDescription: "cans recycled",
				},
			],
			crisisAlerts: [
				{
					id: "c1",
					title: "Prepare Emergency Supply Kits",
					urgency: "high",
					location: "River District",
					xp: 300,
					volunteers: 45,
					date: "Dec 28",
					time: "Immediate",
					requiresMultiple: true,
					totalRequired: 10,
					progressDescription: "kits prepared",
				},
				{
					id: "c2",
					title: "Emergency Meal Prep",
					urgency: "medium",
					location: "Community Kitchen",
					xp: 180,
					volunteers: 12,
					date: "Dec 29",
					time: "6:00 AM",
				},
			],
			miniGames: [
				{
					id: "g1",
					title: "Trash Hunter",
					description: "Pick up 20 pieces of litter in your area",
					xp: 50,
					icon: "🗑️",
					date: "Anytime",
					time: "30 min",
				},
				{
					id: "g2",
					title: "Recycle Challenge",
					description: "Sort 15 recyclable items correctly",
					xp: 60,
					icon: "♻️",
					date: "Anytime",
					time: "20 min",
				},
				{
					id: "g3",
					title: "Clean Streets",
					description: "Clean a 2-block radius",
					xp: 80,
					icon: "🧹",
					date: "Anytime",
					time: "45 min",
				},
			],
		};
	}
}

// Singleton instance
export const claudeService = new ClaudeService();
