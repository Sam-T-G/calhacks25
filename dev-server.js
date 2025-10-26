import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

// In-memory session store for context
const sessionStore = new Map();

// Clean up old sessions periodically
setInterval(() => {
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [sessionId, context] of sessionStore.entries()) {
    if (context.sessionStartTime < dayAgo) {
      sessionStore.delete(sessionId);
    }
  }
}, 60 * 60 * 1000); // Run every hour

app.get('/api/livekit-token', async (req, res) => {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      throw new Error('LiveKit credentials not configured');
    }

    const roomName = req.query.roomName || `dogood-${Date.now()}`;
    const participantName = req.query.participantName || `user-${Math.floor(Math.random() * 10000)}`;

    // Get user context from query params
    const userContext = req.query.userContext || '';

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      ttl: '10m',
      // Store user context in token metadata for voice agent access
      metadata: JSON.stringify({
        userContext: userContext,
      }),
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    res.status(200).json({
      token,
      wsUrl,
      roomName,
    });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({
      error: 'Failed to generate token',
      message: error.message
    });
  }
});

// Context API endpoints
app.get('/api/context', async (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const context = sessionStore.get(sessionId);
  if (!context) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.status(200).json(context);
});

app.post('/api/context', async (req, res) => {
  const { sessionId } = req.query;
  const context = req.body;

  if (!sessionId || !context) {
    return res.status(400).json({ error: 'sessionId and context are required' });
  }

  sessionStore.set(sessionId, context);
  console.log(`[Context] Stored context for session ${sessionId}`);
  res.status(200).json({ success: true, context });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
