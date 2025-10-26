import { useEffect, useCallback } from 'react';
import { contextService, ActivityEvent } from '../services/contextService';

/**
 * React hook for tracking user context throughout the app
 *
 * Usage:
 * ```tsx
 * const { trackPage, logActivity, startTask, completeTask } = useContext();
 *
 * // Track page visit
 * useEffect(() => {
 *   trackPage('Home');
 * }, []);
 *
 * // Log custom activity
 * logActivity('custom', 'User clicked refresh button');
 *
 * // Track task progress
 * startTask('task-1', 'Park Cleanup');
 * completeTask('task-1', 'Park Cleanup', 100);
 * ```
 */
export function useUserContext() {
  const trackPage = useCallback((pageName: string) => {
    contextService.trackPageVisit(pageName);
  }, []);

  const logActivity = useCallback((
    type: ActivityEvent['type'],
    description: string,
    metadata?: Record<string, any>
  ) => {
    contextService.logActivity(type, description, metadata);
  }, []);

  const startTask = useCallback((taskId: string, taskTitle: string) => {
    contextService.startTask(taskId, taskTitle);
  }, []);

  const completeTask = useCallback((taskId: string, taskTitle: string, xpGained: number) => {
    contextService.completeTask(taskId, taskTitle, xpGained);
  }, []);

  const updatePreferences = useCallback((preferences: any) => {
    contextService.updatePreferences(preferences);
  }, []);

  const getContext = useCallback(() => {
    return contextService.getContext();
  }, []);

  return {
    trackPage,
    logActivity,
    startTask,
    completeTask,
    updatePreferences,
    getContext,
  };
}

/**
 * Hook specifically for tracking page visits
 * Automatically tracks when component mounts
 */
export function usePageTracking(pageName: string) {
  useEffect(() => {
    contextService.trackPageVisit(pageName);
  }, [pageName]);
}
