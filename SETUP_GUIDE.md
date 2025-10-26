# DoGood App - Claude AI Integration Setup Guide

## Overview

The DoGood app now features Claude AI integration for:

1. **Dynamic Activity Generation** - Randomly generated community service opportunities
2. **Photo Verification** - AI-powered task completion verification using your device camera

## Setup Instructions

### 1. Get Your Claude API Key

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (it starts with `sk-ant-`)

### 2. Configure Environment Variables

Create a `.env` file in the project root directory:

```bash
# Create .env file
touch .env
```

Add your API key to the `.env` file:

```env
VITE_ANTHROPIC_API_KEY=sk-ant-your-api-key-here
```

**Important Notes:**

- Never commit your `.env` file to version control
- The `.env` file should be in your `.gitignore`
- Without an API key, the app will use mock data and demo verification

### 3. Install Dependencies & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Features

### Dynamic Activity Generation

Activities are generated dynamically by Claude AI when you visit the "Serve" section.

**How it works:**

1. Navigate to the Serve section
2. Activities are automatically generated on load
3. Click the "Refresh" button to generate new activities
4. Activities include:
   - Community Opportunities (volunteering events)
   - Crisis Alerts (urgent needs)
   - Mini-Games (quick tasks you can do anytime)

**Customization:**
Activities can be personalized based on user preferences. See "User Preferences" section below.

### Photo Verification

Verify task completion using your device's camera and Claude AI.

**How it works:**

1. Click the camera icon 📷 on any activity card
2. Your device camera will open
3. Take a photo of your completed task
4. Review and save the photo
5. Click the checkmark ✓ to verify
6. Claude AI analyzes the photo to verify completion
7. If verified, you earn XP!

**Verification Process:**

- Claude analyzes the image content
- Checks if it shows the completed task
- Provides feedback on verification
- Awards XP if verified

**Tips for successful verification:**

- Take clear, well-lit photos
- Show the relevant activity in the photo
- For cleanup tasks, show the collected trash
- For volunteer work, show yourself at the location
- Be genuine - the AI is reasonably understanding

## User Preferences (Future Implementation)

You can customize activity generation based on your interests and preferences.

### Current Setup

Edit `src/config/userPreferences.ts`:

```typescript
export const userPreferences: UserPreferences = {
	interests: ["environment", "education", "animals"],
	location: "San Francisco, CA",
	availableHours: 5,
	preferredDays: ["Saturday", "Sunday"],
	causes: ["Climate Action", "Youth Programs"],
};
```

### Available Options

```typescript
interface UserPreferences {
	// Topics you're interested in
	interests?: string[];

	// Your location (for nearby opportunities)
	location?: string;

	// Hours available per week
	availableHours?: number;

	// Days you prefer to volunteer
	preferredDays?: string[];

	// Specific causes you care about
	causes?: string[];
}
```

### Examples

**Random Activities (Current Default):**

```typescript
export const userPreferences: UserPreferences = {};
```

**Personalized Activities:**

```typescript
export const userPreferences: UserPreferences = {
	interests: ["environmental conservation", "education"],
	location: "Berkeley, CA",
	availableHours: 8,
	preferredDays: ["Saturday", "Sunday"],
	causes: ["Climate Action", "Youth Mentorship"],
};
```

## Architecture

### File Structure

```
src/
├── types/
│   └── serve.ts                    # TypeScript interfaces
├── services/
│   └── claudeService.ts            # Claude API integration
├── components/
│   ├── ServeSection.tsx            # Main serve section (updated)
│   └── PhotoVerification.tsx       # Camera & verification (updated)
└── config/
    ├── userPreferences.ts          # User preferences config
    └── userPreferences.example.ts  # Example configuration
```

### Key Components

**ClaudeService** (`src/services/claudeService.ts`)

- Handles all Claude API communication
- Generates activities based on preferences
- Verifies photos for task completion
- Falls back to mock data if no API key

**ServeSection** (`src/components/ServeSection.tsx`)

- Loads activities on mount
- Displays activities in categories
- Handles activity completion
- Provides refresh functionality

**PhotoVerification** (`src/components/PhotoVerification.tsx`)

- Opens device camera
- Captures and displays photos
- Sends photos to Claude for verification
- Awards XP on successful verification

## API Usage

### Activity Generation

The Claude service generates activities using this prompt structure:

```
Generate diverse community service activities.

User preferences:
- Interests: [list]
- Location: [location]
- Causes: [list]
- Available hours: [hours]

Returns JSON with:
- communityOpportunities (4 items)
- crisisAlerts (2 items)
- miniGames (3 items)
```

### Photo Verification

Photos are sent to Claude Vision API with:

```
Analyze this image to verify task completion:
Task: [title]
Description: [description]

Returns JSON with:
- verified: boolean
- confidence: 0-1
- message: explanation
```

## Troubleshooting

### API Key Not Working

1. Check `.env` file exists in root directory
2. Verify key format: `VITE_ANTHROPIC_API_KEY=sk-ant-...`
3. Restart the development server after adding the key
4. Check browser console for error messages

### Camera Not Opening

1. Ensure browser has camera permissions
2. Try on mobile device (better camera support)
3. Check if HTTPS is enabled (required for camera access)
4. Some browsers block camera on localhost - use mobile device

### Activities Not Loading

1. Check browser console for errors
2. Verify API key is set correctly
3. Check network tab for API call status
4. App falls back to mock data if API fails

### Verification Not Working

1. Ensure photo is clear and relevant
2. Check that API key has Vision API access
3. Try with a different photo
4. Check browser console for error details

## Future Enhancements

- [ ] User settings UI for preferences
- [ ] Save preferences to local storage
- [ ] Activity history and tracking
- [ ] Social sharing of completed tasks
- [ ] Leaderboard integration
- [ ] More detailed verification feedback
- [ ] Multi-photo verification
- [ ] Location-based activity filtering
- [ ] Calendar integration for scheduled activities

## Security Notes

- API keys are stored in environment variables
- Keys are never exposed in client code
- All API calls are made client-side (consider backend proxy for production)
- Photos are sent to Claude API but not stored by default
- User preferences are stored locally

## Cost Considerations

Claude API costs:

- Activity generation: ~1,000-2,000 tokens per request
- Photo verification: ~500-1,000 tokens + image cost
- Average cost: $0.01-0.02 per activity generation
- Average cost: $0.01-0.03 per photo verification

Tips to reduce costs:

- Cache generated activities
- Implement rate limiting
- Use mock data for development
- Consider backend proxy with caching

## Support

For issues or questions:

1. Check this guide first
2. Review browser console errors
3. Check Anthropic API status
4. Verify API key permissions

## License

This project is part of the DoGood app features.
