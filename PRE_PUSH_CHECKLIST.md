# ✅ Pre-Push Checklist for Vercel Deployment

## Before you `git push`, complete these steps:

### 1. ✅ Set Environment Variables in Vercel Dashboard

**CRITICAL:** Must be done BEFORE pushing!

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these (check all: Production, Preview, Development):

```
LIVEKIT_API_KEY=your_livekit_api_key_here
LIVEKIT_API_SECRET=your_livekit_api_secret_here
LIVEKIT_URL=wss://caleb-2p4jw5ym.livekit.cloud
VITE_MCP_SERVER_URL=https://calhacks25-vhcq.onrender.com/mcp
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 2. ✅ Verify MCP Server is Running

Test MCP server is accessible:
```bash
curl https://calhacks25-vhcq.onrender.com/mcp
```

Should return a response (not 404 or timeout).

### 3. ✅ Test Build Locally

```bash
npm run build
```

Should complete without errors. Output:
```
✓ 1695 modules transformed.
✓ built in ~2s
```

### 4. ✅ Verify Critical Files

Check these files exist and are correct:

- [ ] `vercel.json` - outputDirectory: "build"
- [ ] `package.json` - build script: "vite build"
- [ ] `.gitignore` - includes .env.local
- [ ] `api/livekit-token.js` - passes sessionId in metadata

### 5. ✅ Check What Will Be Committed

```bash
git status
```

**Should see:**
- ✅ Modified: `api/livekit-token.js` (sessionId support)
- ✅ Modified: `src/services/contextService.ts` (syncToMCP)
- ✅ Modified: `src/services/mcpService.ts` (MCP API client)
- ✅ Modified: `src/components/ProductivitySection.tsx` (AI integration)
- ✅ Modified: `src/components/SelfImproveSection.tsx` (AI integration)
- ✅ Modified: `src/components/VoiceAssistant.tsx` (session ID)
- ✅ Modified: `mcp-server/server.py` (AI task generation)
- ✅ Modified: `.env.example` (template)
- ✅ New: Documentation files

**Should NOT see:**
- ❌ `.env.local` (contains secrets!)
- ❌ `mcp-server/.env` (contains secrets!)
- ❌ `node_modules/`
- ❌ `build/` or `dist/`

### 6. ✅ Ready to Push!

If all checks pass, push to git:

```bash
git add .
git commit -m "Add AI-powered task customization with Poke, LiveKit, and Claude integration"
git push origin main
```

Vercel will automatically:
1. Detect the push (within seconds)
2. Build your project (~2 minutes)
3. Deploy to production
4. Site goes live automatically 🚀

### 7. ✅ After Deployment - Verify

Visit your Vercel URL and test:

1. **Productivity Section:**
   - Should show "AI-Personalized Tasks" with ✨ sparkle icon
   - Tasks should load within 2-3 seconds

2. **Self-Improve Section:**
   - Should show "AI-Personalized for You" with ✨ sparkle icon
   - Daily tasks and weekly goals customized

3. **Voice Assistant:**
   - Click "DoGood Companion"
   - Should connect and respond
   - Can ask: "What should I work on?"

4. **Browser Console:**
   - Should show: `[ContextService] Synced to MCP`
   - Should show: `[ProductivitySection] Loaded AI tasks`
   - No errors

---

## 🚨 Common Issues & Quick Fixes

### Build fails in Vercel
→ Make sure you ran `npm run build` locally first

### AI tasks not showing
→ Check VITE_MCP_SERVER_URL is set in Vercel
→ Verify MCP server is running on Render

### Voice assistant not connecting
→ Check LiveKit env vars in Vercel dashboard
→ They must match your LiveKit Cloud project

### "Using default tasks" instead of AI
→ Check MCP server has ANTHROPIC_API_KEY set
→ Check MCP server logs on Render for errors

---

## 🎯 Quick Command Reference

```bash
# Test build
npm run build

# Check git status
git status

# Stage all changes
git add .

# Commit
git commit -m "Your message here"

# Push (triggers Vercel auto-deploy)
git push origin main

# Test MCP server
curl https://calhacks25-vhcq.onrender.com/mcp
```

---

**Once you push, monitor deployment:**
Vercel Dashboard → Deployments → Watch build logs

**Deployment successful when:**
- Status: "Ready" ✅
- No build errors
- Site loads at Vercel URL
- AI features work with ✨ icons

Good luck! 🚀
