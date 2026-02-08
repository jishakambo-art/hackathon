"""Scheduler service for daily podcast generation."""
import asyncio
from datetime import datetime, time as Time
from typing import List, Dict
import pytz

from app.services import demo_store
from app.services.podcast_generator import generate_podcast_for_user
from app.config import get_settings


def should_generate_now(user_prefs: Dict) -> bool:
    """
    Check if podcast should be generated now for this user.

    Returns True if current time matches user's scheduled time (within a 1-minute window).
    """
    if not user_prefs.get("daily_generation_enabled", False):
        return False

    # Get user's timezone and scheduled time
    user_tz = pytz.timezone(user_prefs.get("timezone", "America/Los_Angeles"))
    scheduled_time = user_prefs.get("generation_time", Time(7, 0))

    # Get current time in user's timezone
    now_utc = datetime.utcnow().replace(tzinfo=pytz.UTC)
    now_user_tz = now_utc.astimezone(user_tz)

    # Check if we're within 1 minute of scheduled time
    current_hour = now_user_tz.hour
    current_minute = now_user_tz.minute

    if isinstance(scheduled_time, Time):
        scheduled_hour = scheduled_time.hour
        scheduled_minute = scheduled_time.minute
    else:
        # If it's a string like "07:00", parse it
        parts = str(scheduled_time).split(":")
        scheduled_hour = int(parts[0])
        scheduled_minute = int(parts[1])

    # Match if we're at the exact hour:minute
    return (current_hour == scheduled_hour and current_minute == scheduled_minute)


async def check_and_generate_for_all_users():
    """
    Check all users with daily generation enabled and generate podcasts
    for those whose scheduled time has arrived.

    This function should be called every minute by a cron job.
    """
    settings = get_settings()
    users_to_generate = []

    # Get all users with daily generation enabled
    users_with_schedule = demo_store.get_users_with_daily_generation_enabled()

    print(f"[SCHEDULER] Checking {len(users_with_schedule)} users with daily generation enabled")

    # Check which users need generation now
    for user_prefs in users_with_schedule:
        user_id = user_prefs["user_id"]
        if should_generate_now(user_prefs):
            print(f"[SCHEDULER] User {user_id} is due for generation")
            users_to_generate.append(user_id)

    # Generate podcasts for all matched users
    if users_to_generate:
        print(f"[SCHEDULER] Generating podcasts for {len(users_to_generate)} users")

        # Run generations in parallel
        tasks = []
        for user_id in users_to_generate:
            # Create generation log
            log = demo_store.create_generation_log(user_id)

            # Add to task list
            task = generate_podcast_for_user(
                user_id=user_id,
                generation_id=log["id"],
                settings=settings
            )
            tasks.append(task)

        # Execute all generations concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Log results
        for i, result in enumerate(results):
            user_id = users_to_generate[i]
            if isinstance(result, Exception):
                print(f"[SCHEDULER] Generation failed for user {user_id}: {result}")
            else:
                print(f"[SCHEDULER] Generation completed for user {user_id}")
    else:
        print("[SCHEDULER] No users due for generation at this time")

    return {
        "checked": len(users_with_schedule),
        "generated": len(users_to_generate),
        "users": users_to_generate,
    }


def format_next_generation_time(user_prefs: Dict) -> str:
    """
    Get a human-readable string for when the next generation will occur.

    Example: "Tomorrow at 7:00 AM PST"
    """
    if not user_prefs.get("daily_generation_enabled", False):
        return "Daily generation is disabled"

    user_tz = pytz.timezone(user_prefs.get("timezone", "America/Los_Angeles"))
    scheduled_time = user_prefs.get("generation_time", Time(7, 0))

    # Get current time in user's timezone
    now_utc = datetime.utcnow().replace(tzinfo=pytz.UTC)
    now_user_tz = now_utc.astimezone(user_tz)

    # Get scheduled time today
    if isinstance(scheduled_time, Time):
        scheduled_hour = scheduled_time.hour
        scheduled_minute = scheduled_time.minute
    else:
        parts = str(scheduled_time).split(":")
        scheduled_hour = int(parts[0])
        scheduled_minute = int(parts[1])

    scheduled_today = now_user_tz.replace(
        hour=scheduled_hour,
        minute=scheduled_minute,
        second=0,
        microsecond=0
    )

    # If scheduled time has passed today, show tomorrow
    if now_user_tz >= scheduled_today:
        day_str = "Tomorrow"
    else:
        day_str = "Today"

    # Format time (12-hour with AM/PM)
    time_str = scheduled_today.strftime("%I:%M %p").lstrip("0")
    tz_abbr = scheduled_today.strftime("%Z")

    return f"{day_str} at {time_str} {tz_abbr}"
