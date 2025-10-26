# CORS Error Solution Guide

## ⚠️ The Problem

You're seeing this error:

```
Access to fetch at 'https://api.anthropic.com/v1/messages' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

**This is expected and by design!** The Claude API cannot be called directly from the browser for security reasons.

---

## 🔒 Why This Happens

1. **CORS Protection**: Anthropic's API blocks browser requests
2. **Security**: Your API key would be exposed in client-side code
3. **Risk**: Anyone could steal your key from browser DevTools

**Bottom line:** You need a backend server to proxy API requests.

---

## ✅ Solution Options

### **Option 1: Use Mock Data (Quick Start)**

The app already falls back to mock data when the API fails. This works perfectly for:

- ✅ Testing the UI
- ✅ Demo purposes
- ✅ Development without an API key

**No action needed** - just use the app with mock data!

---

### **Option 2: Deploy with Vercel (RECOMMENDED)**

Deploy your app to Vercel with a serverless function:

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Create vercel.json

```json
{
	"functions": {
		"api/**/*.js": {
			"memory": 1024,
			"maxDuration": 30
		}
	},
	"env": {
		"ANTHROPIC_API_KEY": "@anthropic-api-key"
	}
}
```

#### Step 3: Deploy

```bash
# Login
vercel login

# Set your API key as a secret
vercel secrets add anthropic-api-key sk-ant-your-key-here

# Deploy
vercel deploy --prod
```

#### Step 4: Update claudeService.ts

```typescript
const API_BASE_URL = import.meta.env.PROD
	? "/api/claude" // Production: use serverless function
	: null; // Development: use mock data

// In your API calls:
if (!API_BASE_URL) {
	return this.getMockActivities(); // Use mock data in development
}

const response = await fetch(API_BASE_URL, {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({ action: "generate_activities", preferences }),
});
```

**Benefits:**

- ✅ Production-ready
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Secure API key storage

---

### **Option 3: Local Backend Server**

For local testing with real Claude API:

#### Step 1: Create a simple Express server

Create `server/index.js`:

```javascript
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/api/claude", async (req, res) => {
	const { action, ...params } = req.body;

	try {
		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": process.env.ANTHROPIC_API_KEY,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify(buildRequest(action, params)),
		});

		const data = await response.json();
		res.json(data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

app.listen(3001, () => {
	console.log("Proxy server running on http://localhost:3001");
});
```

#### Step 2: Install dependencies

```bash
npm install express cors dotenv
```

#### Step 3: Update package.json

```json
{
	"scripts": {
		"dev": "vite",
		"proxy": "node server/index.js",
		"dev:all": "concurrently \"npm run dev\" \"npm run proxy\""
	}
}
```

#### Step 4: Update claudeService.ts

```typescript
const CLAUDE_API_URL = "http://localhost:3001/api/claude";
```

---

### **Option 4: Use Netlify Functions**

Similar to Vercel, but for Netlify:

#### Step 1: Create `netlify/functions/claude.js`

(Use the same code as `api/claude.js`)

#### Step 2: Create `netlify.toml`

```toml
[build]
  functions = "netlify/functions"

[dev]
  functions = "netlify/functions"
```

#### Step 3: Deploy

```bash
netlify deploy --prod
```

---

## 🎯 Recommended Approach

### For Development:

**Use mock data** - it's already working perfectly!

### For Production:

**Deploy to Vercel or Netlify** with serverless functions.

---

## 📝 Updated Implementation

I've created `api/claude.js` which you can use with Vercel. To implement:

### 1. Update claudeService.ts

Replace the direct API calls with calls to your backend:

```typescript
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || null;

async generateServeActivities(preferences?: UserPreferences): Promise<ServeActivities> {
  if (!API_ENDPOINT) {
    console.warn("No API endpoint configured. Using mock data.");
    return this.getMockActivities();
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate_activities',
        preferences
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse and return activities...
  } catch (error) {
    console.error('Error generating activities:', error);
    return this.getMockActivities();
  }
}
```

### 2. Update .env

```bash
# For local development (optional)
VITE_API_ENDPOINT=http://localhost:3001/api/claude

# For production (Vercel will use /api/claude automatically)
```

---

## 🎉 Current Status

### What Works Now:

- ✅ **Mock Data Mode** - App works perfectly for testing/demo
- ✅ **UI & Features** - All functionality works with mock data
- ✅ **Image Compression** - All optimizations in place
- ✅ **Error Handling** - Graceful fallbacks

### What Needs Backend:

- ⏳ **Live Claude Generation** - Requires backend proxy
- ⏳ **Photo Verification** - Requires backend proxy

---

## 💡 Quick Decision Guide

**Just testing/demo?**
→ Use mock data (already working!)

**Want real Claude for development?**
→ Run local Express proxy server

**Ready for production?**
→ Deploy to Vercel with serverless function

**Need it working NOW?**
→ Mock data is your friend!

---

## 🚀 Next Steps

1. **For now**: Continue using mock data - everything works!
2. **When ready**: Deploy to Vercel (5 minutes setup)
3. **Optional**: Set up local proxy for testing

The app is fully functional with mock data. Deploy when you're ready for production!
