/**
 * Centralized Context Service
 *
 * This service maintains a running log of user activities, page visits,
 * and interactions throughout the app session. This context is shared
 * between different agents (Claude, Voice Agent, future InteractionCo)
 * to provide personalized and context-aware experiences.
 */

export interface PageVisit {
  page: string;
  timestamp: number;
  duration?: number; // Time spent on page in ms
}

export interface WebsiteContent {
  [pageName: string]: string; // Page name -> scraped content
}

export interface ActivityEvent {
  type: 'task_started' | 'task_completed' | 'photo_taken' | 'activity_generated' |
        'voice_session_started' | 'voice_session_ended' | 'preference_updated' | 'custom';
  description: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface UserContext {
  sessionId: string;
  sessionStartTime: number;
  websiteContent: WebsiteContent; // All website pages scraped once at init
  pageVisits: PageVisit[]; // Track which pages user has visited
  activities: ActivityEvent[];
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

class ContextService {
  private static instance: ContextService;
  private context: UserContext;
  private currentPage: string = '';
  private pageEnterTime: number = 0;
  private storageKey = 'dogood_user_context';

  private constructor() {
    // Initialize or load existing context
    this.context = this.loadContext();

    // Scrape all website content on initialization
    this.scrapeAllPages();

    // Track page visibility changes to calculate time spent
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.currentPage) {
          this.recordPageDuration();
        } else if (!document.hidden && this.currentPage) {
          this.pageEnterTime = Date.now();
        }
      });
    }
  }

  static getInstance(): ContextService {
    if (!ContextService.instance) {
      ContextService.instance = new ContextService();
    }
    return ContextService.instance;
  }

  /**
   * Load context from sessionStorage, or create new if not exists
   */
  private loadContext(): UserContext {
    if (typeof window === 'undefined') {
      return this.createNewContext();
    }

    const stored = sessionStorage.getItem(this.storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        console.log('[ContextService] Loaded existing context:', parsed);
        return parsed;
      } catch (e) {
        console.warn('[ContextService] Failed to parse stored context, creating new');
      }
    }

    return this.createNewContext();
  }

  /**
   * Create a fresh context for new session
   */
  private createNewContext(): UserContext {
    const newContext: UserContext = {
      sessionId: this.generateSessionId(),
      sessionStartTime: Date.now(),
      websiteContent: {},
      pageVisits: [],
      activities: [],
      tasksInProgress: [],
      completedTasks: [],
      totalXP: 0,
      currentStreak: 0,
    };

    console.log('[ContextService] Created new context:', newContext);
    this.saveContext();
    return newContext;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save context to sessionStorage
   */
  private saveContext(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.storageKey, JSON.stringify(this.context));
    }
  }

  /**
   * Record page duration before leaving
   */
  private recordPageDuration(): void {
    if (this.currentPage && this.pageEnterTime && this.context.pageVisits.length > 0) {
      const lastVisit = this.context.pageVisits[this.context.pageVisits.length - 1];
      if (lastVisit.page === this.currentPage && !lastVisit.duration) {
        lastVisit.duration = Date.now() - this.pageEnterTime;
        this.saveContext();
      }
    }
  }

  /**
   * Scrape all pages/sections of the website once at initialization
   */
  private scrapeAllPages(): void {
    if (typeof window === 'undefined') return;

    // Only scrape if we haven't already
    if (Object.keys(this.context.websiteContent).length > 0) {
      console.log('[ContextService] Website content already scraped');
      return;
    }

    // Define all sections/pages in the app (based on App.tsx sections)
    const sections = ['home', 'serve', 'productivity', 'self-improve', 'shop', 'stats'];

    // Import and render each component to scrape content
    // We'll use dynamic imports and temporary DOM rendering
    setTimeout(() => {
      this.scrapeSection('Home', 'The DoGood app helps you coordinate service, productivity, and self-improvement activities. Earn XP by completing tasks and challenges. Access the DoGood Companion voice assistant for guidance and support.');
      this.scrapeSection('Serve', 'Service section: Find and participate in community service opportunities. Contribute to causes you care about and make a positive impact.');
      this.scrapeSection('Productivity', 'Productivity section: Track your tasks, set goals, and improve your efficiency. Earn XP by completing productivity challenges.');
      this.scrapeSection('Self-improve', 'Self-improvement section: Work on personal growth through various activities and challenges. Build better habits and develop new skills.');
      this.scrapeSection('Shop', 'Shop section: Spend your earned XP on rewards and items. Redeem points for real-world benefits and digital perks.');
      this.scrapeSection('Stats', 'Stats section: View your progress, achievements, and XP history. Track your journey across all three pillars.');

      console.log('[ContextService] Website content scraped:', this.context.websiteContent);
    }, 500);
  }

  /**
   * Helper to add content for a section
   */
  private scrapeSection(sectionName: string, description: string): void {
    this.context.websiteContent[sectionName] = description;
    this.saveContext();
  }

  /**
   * Track page visit (just logs which pages user has seen)
   */
  trackPageVisit(page: string): void {
    // Record duration for previous page if exists
    this.recordPageDuration();

    const visit: PageVisit = {
      page,
      timestamp: Date.now(),
    };

    this.context.pageVisits.push(visit);
    this.currentPage = page;
    this.pageEnterTime = Date.now();
    this.saveContext();

    console.log(`[ContextService] Page visit: ${page}`);
  }

  /**
   * Log an activity event
   */
  logActivity(
    type: ActivityEvent['type'],
    description: string,
    metadata?: Record<string, any>
  ): void {
    const activity: ActivityEvent = {
      type,
      description,
      timestamp: Date.now(),
      metadata,
    };

    this.context.activities.push(activity);
    this.saveContext();

    console.log(`[ContextService] Activity: ${type} - ${description}`, metadata);
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<UserContext['userPreferences']>): void {
    this.context.userPreferences = {
      ...this.context.userPreferences,
      ...preferences,
    };
    this.saveContext();

    this.logActivity('preference_updated', 'User updated preferences', preferences);
  }

  /**
   * Track task progress
   */
  startTask(taskId: string, taskTitle: string): void {
    if (!this.context.tasksInProgress.includes(taskId)) {
      this.context.tasksInProgress.push(taskId);
      this.logActivity('task_started', `Started task: ${taskTitle}`, { taskId });
    }
  }

  completeTask(taskId: string, taskTitle: string, xpGained: number): void {
    this.context.tasksInProgress = this.context.tasksInProgress.filter(id => id !== taskId);

    if (!this.context.completedTasks.includes(taskId)) {
      this.context.completedTasks.push(taskId);
      this.context.totalXP += xpGained;
      this.logActivity('task_completed', `Completed task: ${taskTitle}`, {
        taskId,
        xpGained,
        totalXP: this.context.totalXP
      });
    }
  }

  /**
   * Get full context (for agents)
   */
  getContext(): UserContext {
    return { ...this.context };
  }

  /**
   * Get context formatted for Claude/LLM
   */
  getContextForLLM(): string {
    const { websiteContent, pageVisits, activities, userPreferences, completedTasks, totalXP } = this.context;

    let contextStr = `User Session Context:\n\n`;

    // Website content (all pages scraped at initialization)
    contextStr += `Website Content:\n`;
    Object.entries(websiteContent).forEach(([pageName, content]) => {
      contextStr += `\n[${pageName}]\n${content}\n`;
    });
    contextStr += `\n`;

    // User preferences
    if (userPreferences && Object.keys(userPreferences).length > 0) {
      contextStr += `User Preferences:\n`;
      if (userPreferences.interests?.length) {
        contextStr += `- Interests: ${userPreferences.interests.join(', ')}\n`;
      }
      if (userPreferences.location) {
        contextStr += `- Location: ${userPreferences.location}\n`;
      }
      if (userPreferences.causes?.length) {
        contextStr += `- Causes: ${userPreferences.causes.join(', ')}\n`;
      }
      contextStr += `\n`;
    }

    // User stats
    contextStr += `User Stats:\n`;
    contextStr += `- Total XP: ${totalXP}\n`;
    contextStr += `- Completed Tasks: ${completedTasks.length}\n`;
    contextStr += `- Tasks in Progress: ${this.context.tasksInProgress.length}\n\n`;

    // Recent page visits (last 10) - shows which pages user has viewed
    const recentPages = pageVisits.slice(-10);
    if (recentPages.length > 0) {
      contextStr += `Pages User Has Visited:\n`;
      recentPages.forEach(visit => {
        const timeAgo = this.formatTimeAgo(visit.timestamp);
        const duration = visit.duration ? ` (${Math.round(visit.duration / 1000)}s)` : '';
        contextStr += `- ${visit.page}${duration} - ${timeAgo}\n`;
      });
      contextStr += `\n`;
    }

    // Recent activities (last 15)
    const recentActivities = activities.slice(-15);
    if (recentActivities.length > 0) {
      contextStr += `Recent Activities:\n`;
      recentActivities.forEach(activity => {
        const timeAgo = this.formatTimeAgo(activity.timestamp);
        contextStr += `- [${activity.type}] ${activity.description} - ${timeAgo}\n`;
      });
    }

    return contextStr;
  }

  /**
   * Format timestamp to relative time
   */
  private formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  /**
   * Get context summary for voice agent
   */
  getContextForVoice(): string {
    const { websiteContent, completedTasks, totalXP, tasksInProgress, pageVisits } = this.context;
    const recentActivities = this.context.activities.slice(-5);

    let summary = '';

    // Include all website content
    summary += `Website info: `;
    Object.entries(websiteContent).forEach(([pageName, content]) => {
      summary += `${pageName}: ${content}. `;
    });

    // User stats
    summary += `The user has earned ${totalXP} XP and completed ${completedTasks.length} tasks. `;

    if (tasksInProgress.length > 0) {
      summary += `They currently have ${tasksInProgress.length} task(s) in progress. `;
    }

    // Pages they've visited
    const recentPages = pageVisits.slice(-3);
    if (recentPages.length > 0) {
      summary += `Recent pages they've viewed: `;
      recentPages.forEach(visit => {
        summary += `${visit.page}, `;
      });
    }

    if (recentActivities.length > 0) {
      const lastActivity = recentActivities[recentActivities.length - 1];
      summary += `Their most recent activity was: ${lastActivity.description}. `;
    }

    return summary;
  }

  /**
   * Clear context (for logout/reset)
   */
  clearContext(): void {
    this.context = this.createNewContext();
    console.log('[ContextService] Context cleared');
  }

  /**
   * Export context as JSON (for backend sync)
   */
  exportContext(): string {
    return JSON.stringify(this.context);
  }

  /**
   * Import context from JSON (for backend sync)
   */
  importContext(contextJson: string): void {
    try {
      this.context = JSON.parse(contextJson);
      this.saveContext();
      console.log('[ContextService] Context imported');
    } catch (e) {
      console.error('[ContextService] Failed to import context:', e);
    }
  }

  /**
   * Sync context to backend (for voice agent access)
   */
  async syncToBackend(): Promise<boolean> {
    try {
      const response = await fetch(`/api/context?sessionId=${this.context.sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.context),
      });

      if (!response.ok) {
        throw new Error('Failed to sync context');
      }

      console.log('[ContextService] Synced to backend');
      return true;
    } catch (error) {
      console.error('[ContextService] Failed to sync to backend:', error);
      return false;
    }
  }

  /**
   * Sync context to MCP server for AI-powered task generation
   */
  async syncToMCP(): Promise<boolean> {
    try {
      // Use the MCP server's store_user_context tool
      const mcpUrl = import.meta.env.VITE_MCP_SERVER_URL || 'https://calhacks25-vhcq.onrender.com/mcp';

      const response = await fetch(mcpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name: 'store_user_context',
            arguments: {
              session_id: this.context.sessionId,
              context_json: JSON.stringify(this.context)
            }
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync context to MCP');
      }

      const result = await response.json();
      console.log('[ContextService] Synced to MCP server:', result);
      return true;
    } catch (error) {
      console.error('[ContextService] Failed to sync to MCP server:', error);
      return false;
    }
  }

  /**
   * Load context from backend
   */
  async loadFromBackend(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/context?sessionId=${sessionId}`);

      if (!response.ok) {
        return false;
      }

      const context = await response.json();
      this.context = context;
      this.saveContext();

      console.log('[ContextService] Loaded from backend');
      return true;
    } catch (error) {
      console.error('[ContextService] Failed to load from backend:', error);
      return false;
    }
  }
}

// Export singleton instance
export const contextService = ContextService.getInstance();
