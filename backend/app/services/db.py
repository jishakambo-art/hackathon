"""Database service for Supabase operations."""
from typing import List, Dict, Optional
from datetime import datetime, time
from supabase import Client

from app.config import get_settings


def get_db_client() -> Client:
    """Get Supabase client with service key for database operations."""
    from app.services.supabase import get_supabase_client
    settings = get_settings()
    return get_supabase_client(settings)


# RSS Sources
def get_rss_sources(user_id: str) -> List[Dict]:
    """Get all RSS sources for a user."""
    client = get_db_client()
    response = client.table("rss_sources").select("*").eq("user_id", user_id).execute()
    return response.data


def add_rss_source(user_id: str, url: str, name: str) -> Dict:
    """Add a new RSS source."""
    client = get_db_client()
    data = {
        "user_id": user_id,
        "url": url,
        "name": name,
        "enabled": True,
    }
    response = client.table("rss_sources").insert(data).execute()
    return response.data[0]


def delete_rss_source(user_id: str, source_id: str) -> bool:
    """Delete an RSS source."""
    client = get_db_client()
    client.table("rss_sources").delete().eq("id", source_id).eq("user_id", user_id).execute()
    return True


# News Topics
def get_news_topics(user_id: str) -> List[Dict]:
    """Get all news topics for a user."""
    client = get_db_client()
    response = client.table("news_topics").select("*").eq("user_id", user_id).execute()
    return response.data


def add_news_topic(user_id: str, topic: str) -> Dict:
    """Add a new news topic."""
    client = get_db_client()
    data = {
        "user_id": user_id,
        "topic": topic,
        "enabled": True,
    }
    response = client.table("news_topics").insert(data).execute()
    return response.data[0]


def delete_news_topic(user_id: str, topic_id: str) -> bool:
    """Delete a news topic."""
    client = get_db_client()
    client.table("news_topics").delete().eq("id", topic_id).eq("user_id", user_id).execute()
    return True


# User Preferences
def get_user_preferences(user_id: str) -> Optional[Dict]:
    """Get user preferences."""
    client = get_db_client()
    response = client.table("user_preferences").select("*").eq("user_id", user_id).execute()

    if response.data:
        return response.data[0]

    # Create default preferences if they don't exist
    return create_user_preferences(user_id)


def create_user_preferences(user_id: str) -> Dict:
    """Create default user preferences."""
    client = get_db_client()
    data = {
        "user_id": user_id,
        "podcast_style": "deep-dive",
        "podcast_length": "medium",
        "language": "en",
        "timezone": "America/Los_Angeles",
        "daily_generation_enabled": False,
        "generation_time": "07:00:00",
    }
    response = client.table("user_preferences").insert(data).execute()
    return response.data[0]


def update_user_preferences(user_id: str, updates: Dict) -> Dict:
    """Update user preferences."""
    client = get_db_client()

    # Ensure user_id is not in updates
    updates.pop("user_id", None)
    updates["updated_at"] = datetime.utcnow().isoformat()

    # Upsert: insert if doesn't exist, update if exists
    response = client.table("user_preferences").upsert({
        "user_id": user_id,
        **updates
    }).execute()

    return response.data[0]


# Generation Logs
def create_generation_log(user_id: str) -> Dict:
    """Create a new generation log."""
    client = get_db_client()
    data = {
        "user_id": user_id,
        "scheduled_at": datetime.utcnow().isoformat() + 'Z',
        "status": "scheduled",
    }
    response = client.table("generation_logs").insert(data).execute()
    return response.data[0]


def get_generation_logs(user_id: str, limit: int = 10) -> List[Dict]:
    """Get generation logs for a user."""
    client = get_db_client()
    response = (
        client.table("generation_logs")
        .select("*")
        .eq("user_id", user_id)
        .order("scheduled_at", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data


def get_generation_log(user_id: str, generation_id: str) -> Optional[Dict]:
    """Get a specific generation log."""
    client = get_db_client()
    response = (
        client.table("generation_logs")
        .select("*")
        .eq("id", generation_id)
        .eq("user_id", user_id)
        .execute()
    )
    return response.data[0] if response.data else None


def update_generation_log(generation_id: str, updates: Dict) -> Dict:
    """Update a generation log."""
    client = get_db_client()
    updates["updated_at"] = datetime.utcnow().isoformat()

    response = (
        client.table("generation_logs")
        .update(updates)
        .eq("id", generation_id)
        .execute()
    )
    return response.data[0]


# Scheduler functions
def get_users_with_daily_generation_enabled() -> List[Dict]:
    """Get all users with daily generation enabled."""
    client = get_db_client()
    response = (
        client.table("user_preferences")
        .select("*")
        .eq("daily_generation_enabled", True)
        .execute()
    )
    return response.data


# NotebookLM Credentials
def get_notebooklm_credentials(user_id: str) -> Optional[Dict]:
    """Get NotebookLM credentials for a user."""
    client = get_db_client()
    response = (
        client.table("user_credentials")
        .select("notebooklm_session")
        .eq("user_id", user_id)
        .execute()
    )

    if response.data and response.data[0].get("notebooklm_session"):
        return response.data[0]["notebooklm_session"]
    return None


def save_notebooklm_credentials(user_id: str, credentials: Dict) -> Dict:
    """Save NotebookLM credentials for a user."""
    client = get_db_client()

    data = {
        "user_id": user_id,
        "notebooklm_session": credentials,
        "updated_at": datetime.utcnow().isoformat(),
    }

    # Upsert: insert if doesn't exist, update if exists
    response = client.table("user_credentials").upsert(data).execute()
    return response.data[0]


def delete_notebooklm_credentials(user_id: str) -> bool:
    """Delete NotebookLM credentials for a user."""
    client = get_db_client()
    client.table("user_credentials").update({
        "notebooklm_session": None,
        "updated_at": datetime.utcnow().isoformat(),
    }).eq("user_id", user_id).execute()
    return True
