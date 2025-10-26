// In-memory session store (in production, use Redis or similar)
const sessionStore = new Map();

// Clean up old sessions periodically
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

let cleanupTimer = null;

function startCleanup() {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(() => {
      const dayAgo = Date.now() - SESSION_TTL;
      for (const [sessionId, context] of sessionStore.entries()) {
        if (context.sessionStartTime < dayAgo) {
          sessionStore.delete(sessionId);
        }
      }
    }, CLEANUP_INTERVAL);
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  startCleanup();

  const { sessionId } = req.query;

  if (!sessionId) {
    res.status(400).json({ error: 'sessionId is required' });
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get context for session
      const context = sessionStore.get(sessionId);

      if (!context) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      res.status(200).json(context);
    } else if (req.method === 'POST') {
      // Create or update full context
      const context = req.body;

      if (!context || !context.sessionId) {
        res.status(400).json({ error: 'Invalid context data' });
        return;
      }

      sessionStore.set(sessionId, context);
      res.status(200).json({ success: true, context });
    } else if (req.method === 'PUT') {
      // Partial update
      const existing = sessionStore.get(sessionId);

      if (!existing) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      const updates = req.body;
      const updated = {
        ...existing,
        ...updates,
        // Merge arrays instead of replacing
        pageVisits: [...(existing.pageVisits || []), ...(updates.pageVisits || [])],
        activities: [...(existing.activities || []), ...(updates.activities || [])],
        tasksInProgress: updates.tasksInProgress || existing.tasksInProgress,
        completedTasks: [...(existing.completedTasks || []), ...(updates.completedTasks || [])],
      };

      sessionStore.set(sessionId, updated);
      res.status(200).json({ success: true, context: updated });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Context API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}
