# Deploying DoGood MCP Server to Render

## Quick Deployment Guide for CalHacks 2025

### Step 1: Push to GitHub

1. Make sure you're in the calhacks25 repository:
```bash
cd /Users/joelnewton/Desktop/calhacks25
```

2. Add the MCP server files to git:
```bash
git add mcp-server/
git commit -m "Add DoGood MCP server with Poke integration for CalHacks 2025"
git push origin main
```

### Step 2: Deploy to Render

#### Option A: One-Click Deploy (Recommended)

1. Go to https://render.com
2. Sign up or log in with your GitHub account
3. Click "New +" → "Web Service"
4. Connect your GitHub repository: `Sam-T-G/calhacks25`
5. Configure the service:
   - **Name**: `dogood-mcp-server`
   - **Root Directory**: `mcp-server`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python server.py`
   - **Instance Type**: Free

6. Add Environment Variables:
   - `PORT` = `8000`
   - `POKE_API_KEY` = `pk_kCas6XWwSAyHKdmy0Of0h9ZNyOus5WzsCu2mQyDAZQw`
   - `ENVIRONMENT` = `production`

7. Click "Create Web Service"

Your server will be deployed at: `https://dogood-mcp-server.onrender.com/mcp`

#### Option B: Using render.yaml (Alternative)

Render will auto-detect the `render.yaml` file in the mcp-server directory.

### Step 3: Connect to Poke

Once deployed:

1. Go to https://poke.com/settings/connections/integrations/new
2. **Integration URL**: `https://dogood-mcp-server.onrender.com/mcp`
3. **Transport Type**: Streamable HTTP
4. **Name**: DoGood MCP Server
5. Click "Save"

### Step 4: Test Your Integration

Try these commands in Poke:

- "Tell the subagent to use the DoGood MCP Server integration's send_poke_message tool with message 'Testing my CalHacks project!'"
- "What community service activities can I do in 1 hour?"
- "Show me my DoGood stats"
- "Remind me to volunteer at the food bank tomorrow at 3pm"

### Available Tools

Your MCP server provides these tools to Poke:

1. **send_poke_message** - Send notifications via Poke
2. **get_activity_suggestions** - Get personalized volunteer activities
3. **record_activity_completion** - Track completed activities and earn XP
4. **get_user_stats** - View user progress and achievements
5. **schedule_activity_reminder** - Create reminders with Poke notifications
6. **get_server_info** - Get server information

### Troubleshooting

**Server not responding?**
- Check Render logs for errors
- Verify environment variables are set correctly
- Make sure the URL ends with `/mcp`

**Poke not calling the tool?**
- Try sending `clearhistory` to Poke to reset
- Make sure you use the exact integration name you set up
- Be explicit: "Tell the subagent to use the {integration name} integration's {tool name} tool"

**Port issues locally?**
- Change PORT environment variable: `PORT=8001 python server.py`

### Local Testing

Test locally before deploying:
```bash
cd mcp-server
source venv/bin/activate
python server.py
# Server runs on http://localhost:8000/mcp
```

Test with curl:
```bash
./test_poke.sh
```

Good luck at CalHacks 2025! 🌴
