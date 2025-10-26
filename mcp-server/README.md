# DoGood MCP Server

A Model Context Protocol (MCP) server for the DoGood community service app with Poke integration.

## Features

This MCP server provides tools for:

- **Send messages to Poke** - Send notifications and reminders via Poke API
- **Get activity suggestions** - Generate personalized community service activities
- **Record activity completion** - Track completed activities and award XP
- **Get user stats** - View user progress and achievements
- **Schedule reminders** - Create reminders with optional Poke notifications
- **Server info** - Get information about the MCP server

## Local Development

### Setup

1. Install dependencies:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. Set environment variables (optional):
```bash
export POKE_API_KEY="your-poke-api-key"
export PORT=8000
```

3. Run the server:
```bash
python server.py
```

The server will be available at `http://localhost:8000/mcp`

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector
```

Then connect to `http://localhost:8000/mcp` using "Streamable HTTP" transport.

## Deployment to Render

### Option 1: One-Click Deploy

Click the button below to deploy to Render:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/YOUR_USERNAME/calhacks25)

### Option 2: Manual Deployment

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your repository
4. Render will auto-detect the `render.yaml` configuration
5. Add your Poke API key as an environment variable

## Connecting to Poke

Once deployed, add your MCP server to Poke:

1. Go to https://poke.com/settings/connections/integrations/new
2. Enter your server URL: `https://your-service.onrender.com/mcp`
3. Select "Streamable HTTP" as the transport
4. Save the connection

## Available Tools

### send_poke_message
Send a message to Poke via the API
- `message` (string): The message to send

### get_activity_suggestions
Get personalized community service activity suggestions
- `interests` (string): Category of interest (environment, education, community, general)
- `time_available` (int): Available time in minutes
- `location` (string): Location preference

### record_activity_completion
Record a completed activity and award XP
- `activity_name` (string): Name of the completed activity
- `duration_minutes` (int): Duration in minutes
- `photo_verified` (bool): Whether photo verification was completed
- `notes` (string, optional): Additional notes

### get_user_stats
Get user statistics and achievements
- `user_id` (string): User identifier (default: "demo_user")

### schedule_activity_reminder
Create a reminder for an upcoming activity
- `activity_name` (string): Name of the activity
- `scheduled_time` (string): When the activity is scheduled
- `send_poke_notification` (bool): Whether to send to Poke

### get_server_info
Get information about the MCP server

## Example Poke Automation

Once connected to Poke, you can create automations like:

- "Remind me to volunteer at the food bank tomorrow at 3pm"
- "What community service activities can I do in 1 hour?"
- "Record that I completed beach cleanup for 90 minutes"
- "Show me my DoGood stats"

## CalHacks 2025

This project was built for the Poke MCP Challenge at CalHacks 2025!
