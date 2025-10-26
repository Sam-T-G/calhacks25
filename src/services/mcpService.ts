/**
 * MCP Service - Interface to DoGood MCP Server
 *
 * Provides functions to fetch AI-customized tasks and interact with
 * the Poke-integrated MCP server for personalized task generation.
 */

const MCP_SERVER_URL = import.meta.env.VITE_MCP_SERVER_URL || 'https://calhacks25-vhcq.onrender.com/mcp';

interface MCPToolCall {
  method: string;
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

interface MCPResponse {
  content?: any;
  error?: string;
  success?: boolean;
}

/**
 * Call an MCP tool
 */
async function callMCPTool(toolName: string, args: Record<string, any>): Promise<MCPResponse> {
  try {
    const payload: MCPToolCall = {
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`MCP call failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`[MCP Service] Failed to call tool ${toolName}:`, error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    };
  }
}

/**
 * Get AI-customized productivity tasks
 */
export async function getAIProductivityTasks(
  sessionId: string,
  includeWork: boolean = true,
  includePersonal: boolean = true,
  maxTasks: number = 4
): Promise<any> {
  const result = await callMCPTool('get_productivity_tasks', {
    session_id: sessionId,
    include_work: includeWork,
    include_personal: includePersonal,
    max_tasks: maxTasks,
    use_ai: true
  });

  if (result.content) {
    return result.content;
  }

  // Fallback to default
  return {
    tasks: [],
    ai_generated: false,
    message: 'Using default tasks'
  };
}

/**
 * Get AI-customized self-improvement tasks
 */
export async function getAISelfImprovementTasks(
  sessionId: string,
  includeDailyTasks: boolean = true,
  includeWeeklyGoals: boolean = true
): Promise<any> {
  const result = await callMCPTool('get_self_improvement_tasks', {
    session_id: sessionId,
    include_daily_tasks: includeDailyTasks,
    include_weekly_goals: includeWeeklyGoals,
    use_ai: true
  });

  if (result.content) {
    return result.content;
  }

  // Fallback to default
  return {
    daily_tasks: [],
    weekly_goals: [],
    ai_generated: false,
    message: 'Using default tasks'
  };
}

/**
 * Send a Poke notification
 */
export async function sendPokeNotification(message: string): Promise<boolean> {
  const result = await callMCPTool('send_poke_message', {
    message
  });

  return result.success !== false;
}

/**
 * Get activity suggestions
 */
export async function getActivitySuggestions(
  interests: string = 'general',
  timeAvailable: number = 30,
  location: string = 'local'
): Promise<any> {
  const result = await callMCPTool('get_activity_suggestions', {
    interests,
    time_available: timeAvailable,
    location
  });

  return result.content || { suggested_activities: [] };
}
