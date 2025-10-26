import { AccessToken } from 'livekit-server-sdk';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      throw new Error('LiveKit credentials not configured');
    }

    const roomName = req.query.roomName || `dogood-${Date.now()}`;
    const participantName = req.query.participantName || `user-${Math.floor(Math.random() * 10000)}`;

    // Get user context from query params (passed from frontend)
    const userContext = req.query.userContext || '';

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantName,
      ttl: '10m', // Token valid for 10 minutes
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
}
