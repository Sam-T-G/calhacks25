# DoGood App Features

This is a code bundle for DoGood App Features. The original project is available at https://www.figma.com/design/6sOViGx6ABV7U0aTZF4G6b/DoGood-App-Features.

## Setup

### 1. Install Dependencies

Run `npm i` to install the dependencies.

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

## Running the code

Run `npm run dev` to start the development server.

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
