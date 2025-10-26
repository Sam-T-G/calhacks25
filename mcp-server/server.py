#!/usr/bin/env python3
import os
import httpx
from fastmcp import FastMCP
from typing import Optional

mcp = FastMCP("DoGood MCP Server")

# Poke API Configuration
POKE_API_KEY = os.environ.get("POKE_API_KEY", "pk_kCas6XWwSAyHKdmy0Of0h9ZNyOus5WzsCu2mQyDAZQw")
POKE_API_URL = "https://poke.com/api/v1/inbound-sms/webhook"

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

@mcp.tool(description="Get information about the DoGood MCP server")
def get_server_info() -> dict:
    """Get server information"""
    return {
        "server_name": "DoGood MCP Server",
        "version": "1.0.0",
        "description": "MCP server for DoGood community service app with Poke integration",
        "environment": os.environ.get("ENVIRONMENT", "development"),
        "python_version": os.sys.version.split()[0],
        "features": [
            "Send messages to Poke",
            "Get activity suggestions",
            "Record activity completion",
            "Track user stats",
            "Schedule reminders"
        ]
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0"

    print(f"Starting DoGood FastMCP server on {host}:{port}")
    print(f"Poke integration enabled: {bool(POKE_API_KEY)}")

    mcp.run(
        transport="http",
        host=host,
        port=port,
        stateless_http=True
    )
