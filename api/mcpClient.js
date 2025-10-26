/**
 * MCP Client for Poke Interaction CO Integration
 *
 * This client provides bidirectional communication with the Poke Interaction CO MCP server,
 * enabling reading from and injecting data into DoGood app's context and activity structures.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

class DoGoodMCPClient {
	constructor() {
		this.client = null;
		this.isConnected = false;
		this.connectionTimeout = parseInt(process.env.MCP_CONNECTION_TIMEOUT) || 5000;
		this.retryAttempts = parseInt(process.env.MCP_RETRY_ATTEMPTS) || 3;
	}

	/**
	 * Connect to the Poke Interaction CO MCP server
	 */
	async connect() {
		if (this.isConnected && this.client) {
			console.log("[MCP] Already connected");
			return;
		}

		try {
			const mcpServerPath = process.env.MCP_SERVER_PATH || "npx";
			const mcpServerArgs = process.env.MCP_SERVER_ARGS
				? process.env.MCP_SERVER_ARGS.split(" ")
				: ["-y", "@poke/interaction-co"];

			console.log(`[MCP] Connecting to Poke Interaction CO via: ${mcpServerPath} ${mcpServerArgs.join(" ")}`);

			const transport = new StdioClientTransport({
				command: mcpServerPath,
				args: mcpServerArgs,
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

			// Set connection timeout
			const connectionPromise = this.client.connect(transport);
			const timeoutPromise = new Promise((_, reject) =>
				setTimeout(() => reject(new Error("MCP connection timeout")), this.connectionTimeout)
			);

			await Promise.race([connectionPromise, timeoutPromise]);

			this.isConnected = true;
			console.log("[MCP] Successfully connected to Poke Interaction CO");

			// List available tools for debugging
			const tools = await this.client.listTools();
			console.log(`[MCP] Available tools: ${tools.tools.map(t => t.name).join(", ")}`);

		} catch (error) {
			console.error("[MCP] Connection failed:", error.message);
			this.isConnected = false;
			throw error;
		}
	}

	/**
	 * Call an MCP tool with retry logic
	 */
	async callTool(toolName, args, attempt = 1) {
		if (!this.isConnected) {
			await this.connect();
		}

		try {
			console.log(`[MCP] Calling tool: ${toolName}`, args);

			const result = await this.client.callTool({
				name: toolName,
				arguments: args,
			});

			console.log(`[MCP] Tool ${toolName} completed successfully`);
			return result;

		} catch (error) {
			console.error(`[MCP] Error calling tool ${toolName} (attempt ${attempt}):`, error.message);

			// Retry logic
			if (attempt < this.retryAttempts) {
				console.log(`[MCP] Retrying... (${attempt + 1}/${this.retryAttempts})`);
				this.isConnected = false; // Force reconnection
				return await this.callTool(toolName, args, attempt + 1);
			}

			throw error;
		}
	}

	/**
	 * Read user context from DoGood app
	 * @param {string[]} contextTypes - Types of context to retrieve
	 * @returns {Promise<Object>} User context data
	 */
	async getUserContext(contextTypes = []) {
		try {
			const result = await this.callTool("read_user_context", {
				contextTypes: contextTypes.length > 0 ? contextTypes : undefined
			});

			// Parse the result content
			if (result.content && result.content[0]?.text) {
				return JSON.parse(result.content[0].text);
			}

			return {};
		} catch (error) {
			console.error("[MCP] Failed to get user context:", error.message);
			return {}; // Return empty context on failure
		}
	}

	/**
	 * Inject activity into DoGood app context
	 * @param {Object} activity - Activity object to inject
	 * @param {string} contextType - Type of activity (serve, productivity, self_improve)
	 * @param {number} priority - Priority level (0-10)
	 * @returns {Promise<Object>} Injection result
	 */
	async injectActivity(activity, contextType, priority = 5) {
		try {
			const result = await this.callTool("inject_activity", {
				activity,
				contextType,
				priority
			});

			if (result.content && result.content[0]?.text) {
				return JSON.parse(result.content[0].text);
			}

			return { success: true, activity };
		} catch (error) {
			console.error("[MCP] Failed to inject activity:", error.message);
			return { success: false, error: error.message };
		}
	}

	/**
	 * Update task suggestions based on user behavior
	 * @param {Array} suggestions - Array of task suggestions
	 * @param {string} reasoning - Why these suggestions were generated
	 * @returns {Promise<Object>} Update result
	 */
	async updateTaskSuggestions(suggestions, reasoning = "") {
		try {
			const result = await this.callTool("update_task_suggestions", {
				suggestions,
				reasoning
			});

			if (result.content && result.content[0]?.text) {
				return JSON.parse(result.content[0].text);
			}

			return { success: true, updated: suggestions.length };
		} catch (error) {
			console.error("[MCP] Failed to update task suggestions:", error.message);
			return { success: false, error: error.message };
		}
	}

	/**
	 * Enhance activities with Interaction CO insights
	 * @param {Object} activities - Activities to enhance
	 * @param {Object} userContext - User context for personalization
	 * @returns {Promise<Object>} Enhanced activities
	 */
	async enhanceActivities(activities, userContext) {
		try {
			const result = await this.callTool("enhance_activities", {
				activities,
				userContext
			});

			if (result.content && result.content[0]?.text) {
				const enhanced = JSON.parse(result.content[0].text);
				console.log("[MCP] Activities enhanced successfully");
				return enhanced;
			}

			// Fallback to original activities if enhancement fails
			return activities;
		} catch (error) {
			console.error("[MCP] Failed to enhance activities:", error.message);
			return activities; // Return original activities on failure
		}
	}

	/**
	 * Disconnect from MCP server
	 */
	async disconnect() {
		if (this.client) {
			try {
				await this.client.close();
				this.isConnected = false;
				console.log("[MCP] Disconnected from Poke Interaction CO");
			} catch (error) {
				console.error("[MCP] Error during disconnect:", error.message);
			}
		}
	}

	/**
	 * Check if MCP is connected and healthy
	 */
	async healthCheck() {
		try {
			if (!this.isConnected) {
				return { healthy: false, reason: "Not connected" };
			}

			// Try to list tools as a health check
			await this.client.listTools();
			return { healthy: true };
		} catch (error) {
			return { healthy: false, reason: error.message };
		}
	}
}

// Export singleton instance
export default new DoGoodMCPClient();
