/**
 * Shared Session Store
 *
 * This module provides a centralized session store that can be shared
 * across multiple API endpoints (context, activity injection, suggestions).
 *
 * In production, this should be replaced with Redis or a similar distributed cache.
 */

// In-memory session store
export const sessionStore = new Map();

// Clean up old sessions periodically
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

let cleanupTimer = null;

/**
 * Start the cleanup timer
 */
export function startCleanup() {
	if (!cleanupTimer) {
		cleanupTimer = setInterval(() => {
			const dayAgo = Date.now() - SESSION_TTL;
			for (const [sessionId, context] of sessionStore.entries()) {
				if (context.sessionStartTime < dayAgo) {
					sessionStore.delete(sessionId);
					console.log(`[SessionStore] Cleaned up expired session: ${sessionId}`);
				}
			}
		}, CLEANUP_INTERVAL);
	}
}

/**
 * Stop the cleanup timer
 */
export function stopCleanup() {
	if (cleanupTimer) {
		clearInterval(cleanupTimer);
		cleanupTimer = null;
	}
}

/**
 * Get a session by ID
 */
export function getSession(sessionId) {
	return sessionStore.get(sessionId);
}

/**
 * Set/update a session
 */
export function setSession(sessionId, context) {
	sessionStore.set(sessionId, context);
}

/**
 * Delete a session
 */
export function deleteSession(sessionId) {
	sessionStore.delete(sessionId);
}

/**
 * Get all session IDs
 */
export function getAllSessionIds() {
	return Array.from(sessionStore.keys());
}

/**
 * Get session count
 */
export function getSessionCount() {
	return sessionStore.size;
}

// Start cleanup on module load
startCleanup();
