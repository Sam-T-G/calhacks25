# DoGood MCP Server

A Model Context Protocol (MCP) server for the DoGood community service app with Poke integration.

## Features

This MCP server provides tools for:

### Core Features
- **Send messages to Poke** - Send notifications and reminders via Poke API
- **Get activity suggestions** - Generate personalized community service activities
- **Record activity completion** - Track completed activities and award XP
- **Get user stats** - View user progress and achievements
- **Schedule reminders** - Create reminders with optional Poke notifications

### Task Customization (NEW!)
- **Get Productivity Tasks** - Retrieve personalized productivity tasks for the Productivity tab
- **Get Self-Improvement Tasks** - Retrieve personalized self-improvement tasks and weekly goals
- **Add Productivity Task** - Add custom productivity tasks via Poke
- **Add Self-Improvement Task** - Add custom self-improvement goals via Poke

### Utilities
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

### Core Tools

#### send_poke_message
Send a message to Poke via the API
- `message` (string): The message to send

#### get_activity_suggestions
Get personalized community service activity suggestions
- `interests` (string): Category of interest (environment, education, community, general)
- `time_available` (int): Available time in minutes
- `location` (string): Location preference

#### record_activity_completion
Record a completed activity and award XP
- `activity_name` (string): Name of the completed activity
- `duration_minutes` (int): Duration in minutes
- `photo_verified` (bool): Whether photo verification was completed
- `notes` (string, optional): Additional notes

#### get_user_stats
Get user statistics and achievements
- `user_id` (string): User identifier (default: "demo_user")

#### schedule_activity_reminder
Create a reminder for an upcoming activity
- `activity_name` (string): Name of the activity
- `scheduled_time` (string): When the activity is scheduled
- `send_poke_notification` (bool): Whether to send to Poke

### Task Customization Tools (NEW!)

#### get_productivity_tasks
Get personalized productivity tasks for the Productivity tab
- `include_work` (bool): Include work tasks (default: true)
- `include_personal` (bool): Include personal tasks (default: true)
- `max_tasks` (int): Maximum tasks to return (default: 4)

#### get_self_improvement_tasks
Get personalized self-improvement tasks and weekly goals
- `include_daily_tasks` (bool): Include daily tasks (default: true)
- `include_weekly_goals` (bool): Include weekly goals (default: true)

#### add_productivity_task
Add a custom productivity task and send Poke notification
- `title` (string): Task title
- `category` (string): Task category (Work or Personal, default: "Work")
- `xp` (int): XP reward (default: 80)
- `send_notification` (bool): Send Poke notification (default: true)

#### add_self_improvement_task
Add a custom self-improvement task and send Poke notification
- `title` (string): Task title
- `description` (string): Task description
- `xp` (int): XP reward (default: 70)
- `task_type` (string): Type of task ("daily" or "weekly", default: "daily")
- `send_notification` (bool): Send Poke notification (default: true)

### Utility Tools

#### get_server_info
Get information about the MCP server

## Example Poke Automation

Once connected to Poke, you can create automations like:

### Community Service
- "Remind me to volunteer at the food bank tomorrow at 3pm"
- "What community service activities can I do in 1 hour?"
- "Record that I completed beach cleanup for 90 minutes"
- "Show me my DoGood stats"

### Productivity & Self-Improvement (NEW!)
- "Show me my productivity tasks for today"
- "Add 'Finish CalHacks presentation' to my productivity list"
- "What self-improvement tasks should I focus on?"
- "Add a daily task to drink 8 glasses of water"
- "Get my weekly self-improvement goals"

## CalHacks 2025

This project was built for the Poke MCP Challenge at CalHacks 2025!
