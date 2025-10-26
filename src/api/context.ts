/**
 * Context API for sharing user context between frontend and voice agent
 *
 * This allows the voice agent to access user context and add its own
 * context back to the shared store.
 */

import { UserContext } from '../services/contextService';

// In-memory session store (in production, use Redis or similar)
const sessionStore = new Map<string, UserContext>();

// Clean up old sessions (older than 24 hours)
setInterval(() => {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [sessionId, context] of sessionStore.entries()) {
    if (context.sessionStartTime < dayAgo) {
      sessionStore.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); // Run every hour

export async function getContext(sessionId: string): Promise<UserContext | null> {
  return sessionStore.get(sessionId) || null;
}

export async function setContext(sessionId: string, context: UserContext): Promise<void> {
  sessionStore.set(sessionId, context);
}

export async function updateContext(
  sessionId: string,
  updates: Partial<UserContext>
): Promise<UserContext | null> {
  const existing = sessionStore.get(sessionId);
  if (!existing) {
    return null;
  }

  const updated = {
    ...existing,
    ...updates,
  };

  sessionStore.set(sessionId, updated);
  return updated;
}
