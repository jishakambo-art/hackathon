from pydantic import BaseModel
from typing import Optional
from datetime import time


class UserPreferences(BaseModel):
    """User preferences including podcast settings and scheduling."""
    id: str
    user_id: str
    podcast_style: str = "deep-dive"
    podcast_length: str = "medium"
    language: str = "en"
    timezone: str = "America/Los_Angeles"
    daily_generation_enabled: bool = False
    generation_time: time = time(7, 0)  # Default 7:00 AM


class UserPreferencesUpdate(BaseModel):
    """Update user preferences (all fields optional)."""
    podcast_style: Optional[str] = None
    podcast_length: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    daily_generation_enabled: Optional[bool] = None
    generation_time: Optional[time] = None


class SchedulePreferences(BaseModel):
    """Daily generation schedule preferences."""
    daily_generation_enabled: bool
    generation_time: str  # HH:MM format
    timezone: str


class SchedulePreferencesUpdate(BaseModel):
    """Update daily generation schedule."""
    daily_generation_enabled: Optional[bool] = None
    generation_time: Optional[str] = None  # HH:MM format
    timezone: Optional[str] = None
