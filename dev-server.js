import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';

dotenv.config({ path: '.env.local' });

const app = express();
app.use(cors());
app.use(express.json());

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

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      ttl: '10m',
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

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
