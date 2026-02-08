from fastapi import APIRouter, Depends, HTTPException
from datetime import time as Time

from app.config import get_settings, Settings
from app.schemas.preferences import (
    UserPreferences,
    UserPreferencesUpdate,
    SchedulePreferences,
    SchedulePreferencesUpdate,
)
from app.services.supabase import get_current_user
from app.services import demo_store

router = APIRouter()


@router.get("/preferences", response_model=UserPreferences)
async def get_preferences(
    user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Get user preferences including schedule settings."""
    prefs = demo_store.get_user_preferences(user_id)

    if not prefs:
        # Return defaults if not found
        return UserPreferences(
            id="default",
            user_id=user_id,
            podcast_style="deep-dive",
            podcast_length="medium",
            language="en",
            timezone="America/Los_Angeles",
            daily_generation_enabled=False,
            generation_time=Time(7, 0),
        )

    return prefs


@router.put("/preferences", response_model=UserPreferences)
async def update_preferences(
    preferences: UserPreferencesUpdate,
    user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Update user preferences."""
    updated_prefs = demo_store.update_user_preferences(user_id, preferences.dict(exclude_unset=True))

    if not updated_prefs:
        raise HTTPException(status_code=404, detail="Preferences not found")

    return updated_prefs


@router.get("/schedule", response_model=SchedulePreferences)
async def get_schedule(
    user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Get daily generation schedule preferences."""
    prefs = demo_store.get_user_preferences(user_id)

    if not prefs:
        # Return defaults
        return SchedulePreferences(
            daily_generation_enabled=False,
            generation_time="07:00",
            timezone="America/Los_Angeles",
        )

    # Convert time object to HH:MM string
    gen_time = prefs.get("generation_time", Time(7, 0))
    if isinstance(gen_time, Time):
        time_str = gen_time.strftime("%H:%M")
    else:
        time_str = str(gen_time)

    return SchedulePreferences(
        daily_generation_enabled=prefs.get("daily_generation_enabled", False),
        generation_time=time_str,
        timezone=prefs.get("timezone", "America/Los_Angeles"),
    )


@router.put("/schedule", response_model=SchedulePreferences)
async def update_schedule(
    schedule: SchedulePreferencesUpdate,
    user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Update daily generation schedule."""
    update_data = {}

    if schedule.daily_generation_enabled is not None:
        update_data["daily_generation_enabled"] = schedule.daily_generation_enabled

    if schedule.generation_time is not None:
        # Parse HH:MM format to time object
        try:
            hours, minutes = map(int, schedule.generation_time.split(":"))
            update_data["generation_time"] = Time(hours, minutes)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=400,
                detail="Invalid time format. Use HH:MM (e.g., 07:00)"
            )

    if schedule.timezone is not None:
        update_data["timezone"] = schedule.timezone

    updated_prefs = demo_store.update_user_preferences(user_id, update_data)

    if not updated_prefs:
        raise HTTPException(status_code=404, detail="Preferences not found")

    # Return formatted response
    gen_time = updated_prefs.get("generation_time", Time(7, 0))
    if isinstance(gen_time, Time):
        time_str = gen_time.strftime("%H:%M")
    else:
        time_str = str(gen_time)

    return SchedulePreferences(
        daily_generation_enabled=updated_prefs.get("daily_generation_enabled", False),
        generation_time=time_str,
        timezone=updated_prefs.get("timezone", "America/Los_Angeles"),
    )
