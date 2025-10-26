# Quick Start Guide

## Get Started in 3 Steps

### Step 1: Setup (2 minutes)

```bash
# Install dependencies
npm install

# Create .env file (optional but recommended)
echo "VITE_ANTHROPIC_API_KEY=your-api-key-here" > .env
```

Get your API key from: https://console.anthropic.com/

### Step 2: Run (1 command)

```bash
npm run dev
```

The app will open at http://localhost:3000

### Step 3: Test Features

1. **Navigate to "Serve" section**

   - Activities are automatically generated
   - Click "Refresh" to generate new ones

2. **Test Photo Verification**
   - Click camera icon 📷 on any activity
   - Take a photo with your device
   - Click checkmark ✓ to verify
   - Earn XP if verified!

## Without API Key?

No problem! The app works without an API key:

- Uses pre-defined mock activities
- Photo verification runs in demo mode
- Everything else works the same

## Enable Personalization (Optional)

Edit `src/config/userPreferences.ts`:

```typescript
export const userPreferences: UserPreferences = {
	interests: ["environment", "education", "animals"],
	location: "Your City, State",
	causes: ["Climate Action", "Youth Programs"],
};
```

Activities will be personalized to your interests!

## Troubleshooting

**Camera not opening?**

- Ensure you're using HTTPS (or localhost)
- Check browser camera permissions
- Try on mobile device

**Activities not loading?**

- Check console for errors
- Verify API key format
- Restart dev server

**API key not working?**

- Verify format: `VITE_ANTHROPIC_API_KEY=sk-ant-...`
- Restart dev server after adding key
- Check key permissions in Anthropic console

## Need More Help?

- Read `SETUP_GUIDE.md` for detailed instructions
- Check `IMPLEMENTATION_SUMMARY.md` for technical details
- Review `README.md` for feature overview

## What's New?

✨ **Dynamic Activities** - AI-generated opportunities
📷 **Photo Verification** - Real camera integration
🎯 **Smart Verification** - Claude AI analyzes photos
🔄 **Refresh Button** - Generate new activities
⚙️ **Personalization** - Customize based on interests

Enjoy making a difference with DoGood! 🌟
