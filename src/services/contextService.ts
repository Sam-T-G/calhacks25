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
  pageContent?: string; // Scraped text content from the page
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
  pageVisits: PageVisit[];
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
   * Extract visible text content from the current page
   */
  private extractPageContent(): string {
    if (typeof document === 'undefined') return '';

    try {
      // Get the main content area (avoid navigation, headers, footers)
      const mainContent = document.querySelector('main') || document.body;

      // Get all text content, clean it up
      let content = mainContent.innerText || '';

      // Clean up whitespace and limit length
      content = content
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .replace(/\n+/g, ' ')  // Replace newlines with spaces
        .trim();

      // Limit to 1000 characters to keep context manageable
      if (content.length > 1000) {
        content = content.substring(0, 1000) + '...';
      }

      return content;
    } catch (e) {
      console.warn('[ContextService] Failed to extract page content:', e);
      return '';
    }
  }

  /**
   * Track page visit
   */
  trackPageVisit(page: string): void {
    // Record duration for previous page if exists
    this.recordPageDuration();

    // Extract content from the page (with a small delay to let content render)
    setTimeout(() => {
      const pageContent = this.extractPageContent();

      // Update the visit with content if we have it
      if (pageContent && this.context.pageVisits.length > 0) {
        const lastVisit = this.context.pageVisits[this.context.pageVisits.length - 1];
        if (lastVisit.page === page && !lastVisit.pageContent) {
          lastVisit.pageContent = pageContent;
          this.saveContext();
          console.log(`[ContextService] Captured content for ${page}: ${pageContent.substring(0, 100)}...`);
        }
      }
    }, 100);

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
    const { pageVisits, activities, userPreferences, completedTasks, totalXP } = this.context;

    let contextStr = `User Session Context:\n\n`;

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

    // Recent page visits (last 10)
    const recentPages = pageVisits.slice(-10);
    if (recentPages.length > 0) {
      contextStr += `Recent Pages Visited:\n`;
      recentPages.forEach(visit => {
        const timeAgo = this.formatTimeAgo(visit.timestamp);
        const duration = visit.duration ? ` (${Math.round(visit.duration / 1000)}s)` : '';
        contextStr += `- ${visit.page}${duration} - ${timeAgo}\n`;
        if (visit.pageContent) {
          contextStr += `  Content: ${visit.pageContent}\n`;
        }
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
    const { completedTasks, totalXP, tasksInProgress, pageVisits } = this.context;
    const recentActivities = this.context.activities.slice(-5);

    let summary = `The user has earned ${totalXP} XP and completed ${completedTasks.length} tasks. `;

    if (tasksInProgress.length > 0) {
      summary += `They currently have ${tasksInProgress.length} task(s) in progress. `;
    }

    // Include recent page content for context
    const recentPagesWithContent = pageVisits.slice(-3).filter(v => v.pageContent);
    if (recentPagesWithContent.length > 0) {
      summary += `Recent pages they've viewed: `;
      recentPagesWithContent.forEach(visit => {
        summary += `${visit.page} (content: ${visit.pageContent?.substring(0, 200)}), `;
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
