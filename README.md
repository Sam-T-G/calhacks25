# DoGood App Features

This is a code bundle for DoGood App Features. The original project is available at https://www.figma.com/design/6sOViGx6ABV7U0aTZF4G6b/DoGood-App-Features. The fully functional site is found here: https://calhacks25-gamma.vercel.app/

## Project Structure

```
calhacks25/
├── src/               # React frontend application
├── api/               # Vercel serverless functions
├── voice-agent/       # LiveKit voice agent (Python)
└── ...
```

## Setup

### 1. Install Dependencies

**Frontend:**
```bash
npm i
```

**Voice Agent:**
```bash
cd voice-agent
uv sync
cd ..
```

### 2. Claude API - ⚠️ **Important: Requires Backend**

The app uses Claude AI to:

- Generate personalized community service activities
- Verify task completion through photo analysis

**🚨 CORS Limitation:** Claude's API cannot be called directly from browsers due to security restrictions.

#### **Option A: Use Mock Data (Recommended for Testing)**

✅ Works out of the box - no setup needed!

- All features functional
- Perfect for development/demo
- No backend required

#### **Option B: Deploy with Backend (For Production)**

To use real Claude API:

1. **Deploy to Vercel** (Recommended):

   ```bash
   vercel deploy
   vercel secrets add anthropic-api-key sk-ant-your-key-here
   ```

2. **See `CORS_SOLUTION.md` for detailed setup instructions**

**Current Status:** App uses mock data (works perfectly!). Deploy to enable live Claude AI.

### 3. LiveKit Voice Agent Setup

The "DoGood Companion" voice assistant requires LiveKit configuration:

1. **Copy environment variables:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your LiveKit credentials to `.env.local`:**
   ```
   LIVEKIT_API_KEY=your_api_key
   LIVEKIT_API_SECRET=your_api_secret
   LIVEKIT_URL=wss://your-project.livekit.cloud
   ```

3. **Configure the voice agent:**
   ```bash
   cd voice-agent
   # Update .env.local with same LiveKit credentials
   ```

4. **See `voice-agent/SETUP.md` for detailed voice agent setup**

## Running the code

### Quick Start (Recommended)

Run everything with a single command:
```bash
./start-dev.sh
```

This will start:
- LiveKit voice agent (for DoGood Companion)
- API server (for LiveKit token generation)
- Vite development server (React frontend)

The frontend will be available at `http://localhost:3000`.

### Manual Start (Alternative)

If you prefer to run services separately:

**Terminal 1 - Voice Agent:**
```bash
cd voice-agent
uv run agent.py dev
```

**Terminal 2 - Frontend & API:**
```bash
npm run dev
```

## Features

### Dynamic Activity Generation

- Activities in the "Serve" section (currently uses mock data)
- Can be personalized based on user preferences
- Click "Refresh" to generate new activities
- ℹ️ **Requires backend for live Claude generation** (see CORS_SOLUTION.md)

### Photo Verification

- Click the camera button to open your device's camera
- Take a photo of your completed task
- Verification (currently in demo mode)
- Receive XP points for completed tasks
- ℹ️ **Requires backend for AI verification** (see CORS_SOLUTION.md)

### Voice Assistant (DoGood Companion)

- Click "Speak with DoGood Companion" to start a voice conversation
- Real-time audio interaction with AI assistant
- Visual feedback showing listening/thinking/speaking states
- Click "End Conversation" to close the assistant
- Each button press starts a fresh conversation
- ℹ️ **Requires LiveKit setup and running voice agent** (see voice-agent/SETUP.md)
