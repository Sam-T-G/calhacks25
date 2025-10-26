# Vercel Deployment Guide - DoGood AI Integration

## 🚀 Pre-Deployment Checklist

### ✅ All Changes Ready for Deployment

- [x] LiveKit token endpoint passes `sessionId` in metadata
- [x] MCP service uses environment variable for server URL
- [x] Context service syncs to MCP with session ID
- [x] All dependencies properly listed in package.json
- [x] Build tested locally and succeeds
- [x] .gitignore prevents committing sensitive files
- [x] .env.example template created

## 📋 Step-by-Step Deployment Instructions

### Step 1: Set Up Environment Variables in Vercel

**CRITICAL:** You must set these environment variables in your Vercel project dashboard **BEFORE** deployment.

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add the following variables:

#### Required for All Environments (Production, Preview, Development):

```bash
# LiveKit Configuration
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here
LIVEKIT_URL=wss://caleb-2p4jw5ym.livekit.cloud

# MCP Server URL (your Render deployment)
VITE_MCP_SERVER_URL=https://calhacks25-vhcq.onrender.com/mcp

# Claude API Key (optional - for frontend if needed)
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Important Notes:**
- ✅ Check "Production", "Preview", and "Development" for all variables
- ✅ LiveKit variables are used by serverless functions (`api/livekit-token.js`)
- ✅ VITE_ prefixed variables are bundled into the frontend build
- ✅ Make sure there are NO quotes around the values in Vercel UI

### Step 2: Verify MCP Server is Running

Your MCP server must be deployed and accessible at:
```
https://calhacks25-vhcq.onrender.com/mcp
```

**To verify MCP server:**
```bash
curl -X POST https://calhacks25-vhcq.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_server_info",
      "arguments": {}
    }
  }'
```

Expected response should include:
```json
{
  "server_name": "DoGood MCP Server",
  "version": "2.0.0",
  "features": ["Send messages to Poke", "Get activity suggestions", ...]
}
```

**If MCP server is NOT deployed yet**, deploy it to Render with:
- Environment variable: `ANTHROPIC_API_KEY=your_anthropic_api_key_here`
- Build command: `pip install -r requirements.txt`
- Start command: `python server.py`

### Step 3: Commit and Push to Git

```bash
# Stage all changes
git add .

# Commit with a descriptive message
git commit -m "Add AI-powered task customization with Poke, LiveKit, and Claude integration"

# Push to your main branch (or whichever branch Vercel is tracking)
git push origin main
```

**What will be deployed:**
- ✅ Frontend with AI task integration
- ✅ Serverless API functions (LiveKit token, context storage)
- ✅ Updated environment handling
- ✅ All UI improvements (sparkle icons, loading states)

**What will NOT be committed (protected by .gitignore):**
- ❌ .env.local (your local secrets)
- ❌ node_modules
- ❌ build directory
- ❌ .vercel directory

### Step 4: Vercel Auto-Deploy

Once you push to git, Vercel will automatically:

1. **Detect the push** and start a new deployment
2. **Install dependencies** (`npm install`)
3. **Build the project** (`npm run build`)
4. **Deploy serverless functions** from `/api` directory
5. **Deploy static assets** from `/build` directory
6. **Make site live** at your Vercel URL

**Monitor deployment:**
- Go to Vercel Dashboard → Deployments
- Watch the build logs in real-time
- Deployment should take ~2-3 minutes

### Step 5: Verify Deployment

After deployment completes, test these critical features:

#### Test 1: Basic Site Load
```
✓ Visit your Vercel URL
✓ Site loads without errors
✓ Check browser console for errors (should be clean)
```

#### Test 2: LiveKit Voice Assistant
```
✓ Click "DoGood Companion" button
✓ Voice assistant modal opens
✓ Connection establishes (shows "Ready to help!")
✓ Can speak and get responses
```

#### Test 3: AI-Customized Productivity Tasks
```
✓ Navigate to Productivity section
✓ Header shows "AI-Personalized Tasks" with ✨ sparkle icon
✓ Tasks load (may take 2-3 seconds)
✓ Console shows: "[ProductivitySection] Loaded AI tasks"
```

#### Test 4: AI-Customized Self-Improvement
```
✓ Navigate to Self-Improve section
✓ Header shows "AI-Personalized for You" with ✨ sparkle icon
✓ Daily tasks and weekly goals appear
✓ Console shows: "[SelfImproveSection] Loaded AI tasks"
```

#### Test 5: Context Syncing
```
✓ Open browser DevTools → Network tab
✓ Filter by "mcp"
✓ Should see POST requests to MCP server
✓ Requests should return 200 OK status
```

## 🔧 Build Configuration Files

### vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**What this does:**
- `buildCommand`: Runs Vite build
- `outputDirectory`: Serves files from `build/` directory
- `functions`: Configures serverless functions with 1GB RAM and 30s timeout
- `rewrites`: Enables client-side routing (SPA)

### package.json scripts
```json
{
  "scripts": {
    "dev": "node dev-server.js & vite",
    "build": "vite build"
  }
}
```

## 🐛 Troubleshooting

### Issue: Build fails in Vercel

**Check:**
1. Build logs in Vercel dashboard
2. Common errors:
   - Missing dependencies → Check package.json
   - TypeScript errors → Run `npm run build` locally
   - Environment variable issues → Check Vercel env vars

**Solution:**
```bash
# Test build locally first
npm run build

# If successful locally but fails in Vercel, check:
- Node version (Vercel uses Node 18 by default)
- Package lock file is committed
```

### Issue: "AI-Personalized Tasks" not showing

**Possible causes:**

1. **MCP Server Not Responding**
   - Check MCP server is running on Render
   - Verify URL in VITE_MCP_SERVER_URL
   - Check MCP server logs for errors

2. **CORS Issues**
   - MCP server should allow requests from Vercel domain
   - Check browser console for CORS errors

3. **Claude API Key Missing**
   - Verify ANTHROPIC_API_KEY is set in MCP server environment
   - MCP server will fall back to default tasks if key is missing

**Debug:**
```javascript
// Open browser console on deployed site
localStorage.getItem('dogood_user_context')
// Should show user context being stored
```

### Issue: Voice Assistant not connecting

**Possible causes:**

1. **LiveKit Credentials Wrong**
   - Double-check LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL
   - Verify they match your LiveKit Cloud project

2. **Serverless Function Error**
   - Check Vercel Functions logs
   - Go to: Dashboard → Functions → View logs for `/api/livekit-token`

3. **Metadata Not Passed**
   - Check Network tab for `/api/livekit-token` request
   - Should include `?userContext=...&sessionId=...` query params

**Debug:**
```javascript
// Check if token is being generated
fetch('/api/livekit-token?userContext=test&sessionId=test')
  .then(r => r.json())
  .then(console.log)
```

### Issue: Environment variables not working

**Solution:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify all variables are set for Production, Preview, Development
3. After adding/changing env vars, trigger a new deployment:
   - Deployments → ... → Redeploy

**Important:** Vercel only injects environment variables at BUILD time for VITE_ prefixed vars!

## 📦 What Gets Deployed

### Frontend (Static Files)
```
build/
├── index.html
├── assets/
│   ├── index-[hash].js      (Main JS bundle with React app)
│   ├── index-[hash].css     (Compiled styles)
│   └── dglogo-[hash].png    (Logo image)
```

### Serverless Functions
```
api/
├── livekit-token.js   (Generates LiveKit tokens)
├── claude.js          (Claude API proxy - if needed)
└── context.js         (Context storage - if needed)
```

### Environment Variables (Injected at Runtime/Build)
- LIVEKIT_* → Used by serverless functions
- VITE_* → Bundled into frontend build

## 🚦 Deployment Status Indicators

### Success Indicators:
```
✅ Build completes without errors
✅ Deployment status: "Ready"
✅ Site accessible at Vercel URL
✅ No errors in browser console
✅ AI tasks load with sparkle icon ✨
✅ Voice assistant connects
```

### Failure Indicators:
```
❌ Build fails in Vercel logs
❌ Site shows 404 or blank page
❌ Console shows CORS errors
❌ "Using default tasks" instead of AI tasks
❌ Voice assistant stuck on "Connecting..."
```

## 🔄 Re-deployment Process

### After Making Code Changes:

1. **Test locally first:**
   ```bash
   npm run build
   npm run dev
   ```

2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

3. **Vercel auto-deploys** within seconds

### Force Re-deployment (no code changes):

1. Go to Vercel Dashboard → Deployments
2. Click "..." on latest deployment
3. Select "Redeploy"
4. Choose "Use existing Build Cache" or "Redeploy from scratch"

## 📊 Performance Expectations

- **Build time:** ~1-2 minutes
- **Cold start (serverless):** ~500ms
- **AI task generation:** 2-3 seconds
- **Voice connection:** 1-2 seconds
- **Page load:** <2 seconds

## 🎯 Post-Deployment Checklist

After successful deployment:

- [ ] Visit Vercel URL and test basic navigation
- [ ] Test voice assistant connection
- [ ] Verify AI tasks load in Productivity section
- [ ] Verify AI tasks load in Self-Improve section
- [ ] Check browser console for errors
- [ ] Test on mobile device
- [ ] Test in incognito/private mode
- [ ] Verify MCP server is receiving requests (check logs)
- [ ] Test with fresh user (no cached data)

## 🔐 Security Checklist

- [x] API keys stored in Vercel environment variables (not in code)
- [x] .env.local in .gitignore (not committed)
- [x] CORS configured on MCP server
- [x] LiveKit tokens have short TTL (10 minutes)
- [x] Serverless functions have timeout limits

## 📞 Support Resources

**If deployment fails:**

1. Check Vercel build logs first
2. Test build locally: `npm run build`
3. Review this guide's troubleshooting section
4. Check MCP server status on Render
5. Verify all environment variables in Vercel

**Useful Commands:**

```bash
# Test build locally
npm run build

# Run dev server locally
npm run dev

# Check if MCP server is accessible
curl https://calhacks25-vhcq.onrender.com/mcp

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## ✅ Final Confirmation

Your deployment is ready when:

1. ✅ All environment variables set in Vercel
2. ✅ MCP server deployed and running on Render
3. ✅ Code committed and pushed to git
4. ✅ Vercel deployment shows "Ready" status
5. ✅ Site loads at Vercel URL
6. ✅ AI features working (sparkle icons visible)
7. ✅ Voice assistant connects successfully

**You're all set! 🎉**

Push your code to git and watch Vercel automatically deploy your AI-powered DoGood app!
