#!/usr/bin/env python3
import os
import httpx
import json
from fastmcp import FastMCP
from typing import Optional
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

mcp = FastMCP("DoGood MCP Server")

# Poke API Configuration
POKE_API_KEY = os.environ.get("POKE_API_KEY", "pk_kCas6XWwSAyHKdmy0Of0h9ZNyOus5WzsCu2mQyDAZQw")
POKE_API_URL = "https://poke.com/api/v1/inbound-sms/webhook"

# Claude API Configuration
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None

# In-memory context storage (in production, use a database)
user_contexts = {}

@mcp.tool(description="Send a message to Poke - use this to send notifications, reminders, or updates about DoGood activities")
async def send_poke_message(message: str) -> dict:
    """Send a message to Poke via the API"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                POKE_API_URL,
                headers={
                    "Authorization": f"Bearer {POKE_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={"message": message},
                timeout=10.0
            )
            response.raise_for_status()
            return {
                "success": True,
                "message": "Message sent to Poke successfully",
                "response": response.json()
            }
        except httpx.HTTPError as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to send message to Poke"
            }

@mcp.tool(description="Get community service activity suggestions based on user interests and available time")
def get_activity_suggestions(
    interests: str = "general",
    time_available: int = 30,
    location: str = "local"
) -> dict:
    """Generate personalized community service activity suggestions"""

    # Sample activities database
    activities = {
        "environment": [
            {"name": "Beach Cleanup", "duration": 60, "xp": 50, "description": "Help clean local beaches"},
            {"name": "Tree Planting", "duration": 120, "xp": 100, "description": "Plant trees in your community"},
            {"name": "Recycling Drive", "duration": 30, "xp": 30, "description": "Organize a recycling collection"}
        ],
        "education": [
            {"name": "Tutor Students", "duration": 60, "xp": 75, "description": "Help students with homework"},
            {"name": "Read to Kids", "duration": 30, "xp": 40, "description": "Read stories at local library"},
            {"name": "Teach Tech Skills", "duration": 90, "xp": 80, "description": "Teach basic computer skills"}
        ],
        "community": [
            {"name": "Food Bank Volunteer", "duration": 120, "xp": 90, "description": "Help sort and distribute food"},
            {"name": "Senior Center Visit", "duration": 60, "xp": 60, "description": "Spend time with seniors"},
            {"name": "Community Garden", "duration": 90, "xp": 70, "description": "Help maintain community garden"}
        ],
        "general": [
            {"name": "Litter Pickup Walk", "duration": 30, "xp": 35, "description": "Pick up litter in your neighborhood"},
            {"name": "Charity Event Helper", "duration": 180, "xp": 120, "description": "Assist at charity events"},
            {"name": "Animal Shelter Support", "duration": 60, "xp": 65, "description": "Help care for shelter animals"}
        ]
    }

    # Filter activities based on time available
    category = interests.lower() if interests.lower() in activities else "general"
    filtered_activities = [
        act for act in activities[category]
        if act["duration"] <= time_available or time_available >= 60
    ]

    return {
        "category": category,
        "location": location,
        "time_available": time_available,
        "suggested_activities": filtered_activities[:3],
        "total_suggestions": len(filtered_activities)
    }

@mcp.tool(description="Record a completed community service activity and award XP points")
def record_activity_completion(
    activity_name: str,
    duration_minutes: int,
    photo_verified: bool = False,
    notes: Optional[str] = None
) -> dict:
    """Record a completed activity and calculate XP earned"""

    # Calculate XP based on duration and verification
    base_xp = duration_minutes // 2  # 1 XP per 2 minutes
    verification_bonus = 20 if photo_verified else 0
    total_xp = base_xp + verification_bonus

    return {
        "activity": activity_name,
        "duration": duration_minutes,
        "photo_verified": photo_verified,
        "base_xp": base_xp,
        "verification_bonus": verification_bonus,
        "total_xp": total_xp,
        "notes": notes,
        "message": f"Great job! You earned {total_xp} XP for completing {activity_name}!"
    }

@mcp.tool(description="Get user stats and progress in the DoGood app")
def get_user_stats(user_id: str = "demo_user") -> dict:
    """Get user statistics and achievements"""

    # This would normally query a database
    return {
        "user_id": user_id,
        "total_xp": 450,
        "level": 5,
        "activities_completed": 12,
        "total_hours": 18.5,
        "current_streak": 5,
        "badges": ["Tree Hugger", "Community Champion", "First Steps"],
        "next_level_xp": 500,
        "xp_to_next_level": 50
    }

@mcp.tool(description="Create a reminder for an upcoming volunteer activity")
async def schedule_activity_reminder(
    activity_name: str,
    scheduled_time: str,
    send_poke_notification: bool = True
) -> dict:
    """Schedule a reminder for a volunteer activity"""

    reminder_message = f"Reminder: You have '{activity_name}' scheduled for {scheduled_time}. Don't forget to DoGood!"

    result = {
        "activity": activity_name,
        "scheduled_time": scheduled_time,
        "reminder_created": True,
        "message": reminder_message
    }

    # Optionally send to Poke
    if send_poke_notification:
        poke_result = await send_poke_message(reminder_message)
        result["poke_notification"] = poke_result

    return result

@mcp.tool(description="Store user context from the frontend - call this to sync context from the DoGood app")
def store_user_context(session_id: str, context_json: str) -> dict:
    """Store user context for AI-powered task generation"""
    try:
        context = json.loads(context_json)
        user_contexts[session_id] = context
        return {
            "success": True,
            "message": f"Context stored for session {session_id}",
            "session_id": session_id
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "message": "Failed to store context"
        }

@mcp.tool(description="Get personalized productivity task suggestions using AI - tasks based on user's context, patterns, and Poke data")
def get_productivity_tasks(
    session_id: str = "default",
    include_work: bool = True,
    include_personal: bool = True,
    max_tasks: int = 4,
    use_ai: bool = True
) -> dict:
    """Get AI-personalized productivity task suggestions for the DoGood app"""

    # Get user context if available
    user_context = user_contexts.get(session_id, {})

    # If AI is enabled and we have Claude API key and context, use AI generation
    if use_ai and anthropic_client and user_context:
        try:
            # Build context string for Claude
            context_str = f"""User Context:
- Total XP: {user_context.get('totalXP', 0)}
- Completed Tasks: {len(user_context.get('completedTasks', []))}
- Tasks in Progress: {len(user_context.get('tasksInProgress', []))}

Recent Activities:
"""
            for activity in user_context.get('activities', [])[-5:]:
                context_str += f"- [{activity.get('type')}] {activity.get('description')}\n"

            context_str += f"\nPages Visited:\n"
            for visit in user_context.get('pageVisits', [])[-5:]:
                context_str += f"- {visit.get('page')}\n"

            # Call Claude to generate personalized tasks
            prompt = f"""Based on the user's DoGood app context below, generate {max_tasks} personalized productivity tasks.
Consider their activity patterns, interests, and recent behavior.

{context_str}

Generate tasks in this JSON format:
{{
    "tasks": [
        {{
            "id": "unique_id",
            "title": "Task Title",
            "lastDone": "X days ago",
            "xp": 80,
            "category": "Work" or "Personal",
            "color": "#3B3766" for Work or "#4A5A3C" for Personal
        }}
    ]
}}

Include both work tasks (if include_work={include_work}) and personal tasks (if include_personal={include_personal}).
Make tasks relevant to their context and encouraging. Return ONLY the JSON, no other text."""

            response = anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )

            # Parse Claude's response
            ai_response = response.content[0].text.strip()
            # Remove markdown code blocks if present
            if ai_response.startswith("```json"):
                ai_response = ai_response[7:]
            if ai_response.startswith("```"):
                ai_response = ai_response[3:]
            if ai_response.endswith("```"):
                ai_response = ai_response[:-3]

            tasks_data = json.loads(ai_response.strip())

            return {
                "tasks": tasks_data["tasks"][:max_tasks],
                "total_available": len(tasks_data["tasks"]),
                "message": f"AI-generated {len(tasks_data['tasks'][:max_tasks])} personalized tasks",
                "ai_generated": True
            }
        except Exception as e:
            print(f"AI generation failed: {e}, falling back to default tasks")
            # Fall through to default tasks

    # Fallback to default tasks
    work_tasks = [
        {
            "id": "w1",
            "title": "Review Q4 Budget Report",
            "lastDone": "12 days ago",
            "xp": 80,
            "category": "Work",
            "color": "#3B3766"
        },
        {
            "id": "w2",
            "title": "Team 1-on-1 Meetings",
            "lastDone": "8 days ago",
            "xp": 100,
            "category": "Work",
            "color": "#3B3766"
        },
        {
            "id": "w3",
            "title": "Update Project Documentation",
            "lastDone": "15 days ago",
            "xp": 60,
            "category": "Work",
            "color": "#3B3766"
        },
        {
            "id": "w4",
            "title": "Prepare Presentation",
            "lastDone": "10 days ago",
            "xp": 90,
            "category": "Work",
            "color": "#3B3766"
        }
    ]

    personal_tasks = [
        {
            "id": "p1",
            "title": "Exercise Routine",
            "lastDone": "5 days ago",
            "xp": 90,
            "category": "Personal",
            "color": "#4A5A3C"
        },
        {
            "id": "p2",
            "title": "Meal Prep Sunday",
            "lastDone": "7 days ago",
            "xp": 70,
            "category": "Personal",
            "color": "#4A5A3C"
        },
        {
            "id": "p3",
            "title": "Weekly Planning Session",
            "lastDone": "9 days ago",
            "xp": 65,
            "category": "Personal",
            "color": "#4A5A3C"
        }
    ]

    tasks = []
    if include_work:
        tasks.extend(work_tasks)
    if include_personal:
        tasks.extend(personal_tasks)

    # Sort by last done (most overdue first) and limit
    tasks_sorted = sorted(tasks, key=lambda x: int(x["lastDone"].split()[0]), reverse=True)

    return {
        "tasks": tasks_sorted[:max_tasks],
        "total_available": len(tasks_sorted),
        "message": f"Found {len(tasks_sorted[:max_tasks])} productivity tasks",
        "ai_generated": False
    }

@mcp.tool(description="Get AI-personalized self-improvement tasks and weekly goals using user context and patterns")
def get_self_improvement_tasks(
    session_id: str = "default",
    include_daily_tasks: bool = True,
    include_weekly_goals: bool = True,
    use_ai: bool = True
) -> dict:
    """Get AI-personalized self-improvement tasks and goals for the DoGood app"""

    # Get user context if available
    user_context = user_contexts.get(session_id, {})

    # If AI is enabled and we have Claude API key and context, use AI generation
    if use_ai and anthropic_client and user_context:
        try:
            # Build context string for Claude
            context_str = f"""User Context:
- Total XP: {user_context.get('totalXP', 0)}
- Completed Tasks: {len(user_context.get('completedTasks', []))}
- Current Streak: {user_context.get('currentStreak', 0)}

Recent Activities:
"""
            for activity in user_context.get('activities', [])[-5:]:
                context_str += f"- [{activity.get('type')}] {activity.get('description')}\n"

            # Call Claude to generate personalized tasks
            prompt = f"""Based on the user's DoGood app context below, generate personalized self-improvement tasks and weekly goals.
Consider their patterns, interests, and what would help them grow.

{context_str}

Generate in this JSON format:
{{
    "daily_tasks": [
        {{
            "id": "unique_id",
            "title": "Task Title",
            "description": "Encouraging description with context",
            "xp": 80,
            "icon": "Dumbbell|Users|Book|Brain|Heart",
            "color": "#9D5C45|#3B3766|#4A5A3C|#4A3B35"
        }}
    ],
    "weekly_goals": [
        {{
            "id": "goal_id",
            "title": "Goal Title",
            "current": 3,
            "target": 5,
            "xp": 200,
            "icon": "Dumbbell|Book|Brain"
        }}
    ]
}}

Generate {3 if include_daily_tasks else 0} daily tasks and {3 if include_weekly_goals else 0} weekly goals.
Make them personal, encouraging, and relevant to their context. Return ONLY the JSON."""

            response = anthropic_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1536,
                messages=[{"role": "user", "content": prompt}]
            )

            # Parse Claude's response
            ai_response = response.content[0].text.strip()
            # Remove markdown code blocks if present
            if ai_response.startswith("```json"):
                ai_response = ai_response[7:]
            if ai_response.startswith("```"):
                ai_response = ai_response[3:]
            if ai_response.endswith("```"):
                ai_response = ai_response[:-3]

            tasks_data = json.loads(ai_response.strip())

            result = {}
            if include_daily_tasks:
                result["daily_tasks"] = tasks_data.get("daily_tasks", [])
            if include_weekly_goals:
                result["weekly_goals"] = tasks_data.get("weekly_goals", [])

            result["message"] = "AI-personalized self-improvement tasks based on your patterns"
            result["ai_generated"] = True

            return result
        except Exception as e:
            print(f"AI generation failed: {e}, falling back to default tasks")
            # Fall through to default tasks

    # Fallback to default tasks
    daily_tasks = [
        {
            "id": "si1",
            "title": "Hit the gym",
            "description": "You haven't worked out in 4 days. A 30-minute session would be great!",
            "xp": 100,
            "icon": "Dumbbell",
            "color": "#9D5C45"
        },
        {
            "id": "si2",
            "title": "Catch up with Sarah",
            "description": "It's been 3 weeks since you last connected with your friend Sarah.",
            "xp": 80,
            "icon": "Users",
            "color": "#3B3766"
        },
        {
            "id": "si3",
            "title": "Read for 20 minutes",
            "description": "Continue 'Atomic Habits' - you're 60% through!",
            "xp": 60,
            "icon": "Book",
            "color": "#4A5A3C"
        },
        {
            "id": "si4",
            "title": "Practice meditation",
            "description": "Your stress levels have been high. A 10-minute session can help.",
            "xp": 70,
            "icon": "Brain",
            "color": "#4A3B35"
        }
    ]

    weekly_goals = [
        {
            "id": "gym-week",
            "title": "Gym Sessions",
            "current": 3,
            "target": 4,
            "xp": 200,
            "icon": "Dumbbell"
        },
        {
            "id": "reading-week",
            "title": "Reading Days",
            "current": 4,
            "target": 5,
            "xp": 150,
            "icon": "Book"
        },
        {
            "id": "meditation-week",
            "title": "Meditation Days",
            "current": 5,
            "target": 7,
            "xp": 180,
            "icon": "Brain"
        }
    ]

    result = {}
    if include_daily_tasks:
        result["daily_tasks"] = daily_tasks
    if include_weekly_goals:
        result["weekly_goals"] = weekly_goals

    result["message"] = "Personalized self-improvement tasks based on your patterns"
    result["ai_generated"] = False

    return result

@mcp.tool(description="Add a custom productivity task to the user's list and optionally send a Poke notification")
async def add_productivity_task(
    title: str,
    category: str = "Work",
    xp: int = 80,
    send_notification: bool = True
) -> dict:
    """Add a custom productivity task via Poke"""

    task = {
        "title": title,
        "category": category,
        "xp": xp,
        "status": "added",
        "lastDone": "Never"
    }

    result = {
        "success": True,
        "task": task,
        "message": f"Added '{title}' to your productivity tasks"
    }

    # Send notification via Poke
    if send_notification:
        message = f"New task added to your Productivity list: {title} (+{xp} XP)"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    POKE_API_URL,
                    headers={
                        "Authorization": f"Bearer {POKE_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={"message": message},
                    timeout=10.0
                )
                response.raise_for_status()
                result["poke_notification"] = {
                    "success": True,
                    "response": response.json()
                }
            except httpx.HTTPError as e:
                result["poke_notification"] = {
                    "success": False,
                    "error": str(e)
                }

    return result

@mcp.tool(description="Add a custom self-improvement goal or task and optionally send a Poke notification")
async def add_self_improvement_task(
    title: str,
    description: str,
    xp: int = 70,
    task_type: str = "daily",
    send_notification: bool = True
) -> dict:
    """Add a custom self-improvement task via Poke"""

    task = {
        "title": title,
        "description": description,
        "xp": xp,
        "type": task_type,
        "status": "added"
    }

    result = {
        "success": True,
        "task": task,
        "message": f"Added '{title}' to your self-improvement {task_type} tasks"
    }

    # Send notification via Poke
    if send_notification:
        message = f"New {task_type} task added to Self-Improve: {title} - {description} (+{xp} XP)"
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    POKE_API_URL,
                    headers={
                        "Authorization": f"Bearer {POKE_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={"message": message},
                    timeout=10.0
                )
                response.raise_for_status()
                result["poke_notification"] = {
                    "success": True,
                    "response": response.json()
                }
            except httpx.HTTPError as e:
                result["poke_notification"] = {
                    "success": False,
                    "error": str(e)
                }

    return result

@mcp.tool(description="Get information about the DoGood MCP server")
def get_server_info() -> dict:
    """Get server information"""
    return {
        "server_name": "DoGood MCP Server",
        "version": "2.0.0",
        "description": "MCP server for DoGood community service app with Poke integration and task customization",
        "environment": os.environ.get("ENVIRONMENT", "development"),
        "python_version": os.sys.version.split()[0],
        "features": [
            "Send messages to Poke",
            "Get activity suggestions",
            "Record activity completion",
            "Track user stats",
            "Schedule reminders",
            "Customize productivity tasks",
            "Customize self-improvement tasks",
            "Add custom tasks via Poke"
        ]
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0"

    print(f"Starting DoGood FastMCP server on {host}:{port}")
    print(f"Poke integration enabled: {bool(POKE_API_KEY)}")
    print(f"Claude AI integration enabled: {bool(ANTHROPIC_API_KEY)}")
    if ANTHROPIC_API_KEY:
        print(f"  ✓ AI-powered task customization ACTIVE")
    else:
        print(f"  ⚠ AI-powered task customization DISABLED (set ANTHROPIC_API_KEY to enable)")

    mcp.run(
        transport="http",
        host=host,
        port=port,
        stateless_http=True
    )
