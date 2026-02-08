"""In-memory storage for demo mode - no database required."""
from typing import Dict, List
from datetime import datetime, time as Time
import uuid

# In-memory storage
_substack_sources: List[Dict] = []
_rss_sources: List[Dict] = []
_news_topics: List[Dict] = []
_generation_logs: List[Dict] = []
_user_preferences: Dict[str, Dict] = {}  # user_id -> preferences


# ============ Substack Sources ============

def get_substack_sources(user_id: str) -> List[Dict]:
    """Get all Substack sources for a user."""
    return [s for s in _substack_sources if s["user_id"] == user_id]


def update_substack_priorities(user_id: str, priorities: Dict[str, int]):
    """Update Substack source priorities."""
    # Reset all priorities
    for source in _substack_sources:
        if source["user_id"] == user_id:
            source["priority"] = None

    # Set new priorities
    for publication_id, priority in priorities.items():
        for source in _substack_sources:
            if source["user_id"] == user_id and source["publication_id"] == publication_id:
                source["priority"] = priority


# ============ RSS Sources ============

def get_rss_sources(user_id: str) -> List[Dict]:
    """Get all RSS sources for a user."""
    return [s for s in _rss_sources if s["user_id"] == user_id]


def add_rss_source(user_id: str, url: str, name: str) -> Dict:
    """Add a new RSS source."""
    source = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "url": url,
        "name": name,
        "enabled": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    _rss_sources.append(source)
    return source


def delete_rss_source(user_id: str, source_id: str):
    """Delete an RSS source."""
    global _rss_sources
    _rss_sources = [
        s for s in _rss_sources
        if not (s["id"] == source_id and s["user_id"] == user_id)
    ]


# ============ News Topics ============

def get_news_topics(user_id: str) -> List[Dict]:
    """Get all news topics for a user."""
    return [t for t in _news_topics if t["user_id"] == user_id]


def add_news_topic(user_id: str, topic: str) -> Dict:
    """Add a new news topic."""
    topic_obj = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "topic": topic,
        "enabled": True,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    _news_topics.append(topic_obj)
    return topic_obj


def delete_news_topic(user_id: str, topic_id: str):
    """Delete a news topic."""
    global _news_topics
    _news_topics = [
        t for t in _news_topics
        if not (t["id"] == topic_id and t["user_id"] == user_id)
    ]


# ============ Generation Logs ============

def get_generation_logs(user_id: str, limit: int = 10) -> List[Dict]:
    """Get generation logs for a user."""
    logs = [g for g in _generation_logs if g["user_id"] == user_id]
    # Sort by scheduled_at descending
    logs.sort(key=lambda x: x["scheduled_at"], reverse=True)
    return logs[:limit]


def get_generation_log(user_id: str, generation_id: str) -> Dict:
    """Get a specific generation log."""
    for log in _generation_logs:
        if log["id"] == generation_id and log["user_id"] == user_id:
            return log
    return None


def create_generation_log(user_id: str) -> Dict:
    """Create a new generation log."""
    log = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "scheduled_at": datetime.utcnow().isoformat(),
        "started_at": None,
        "completed_at": None,
        "status": "scheduled",
        "notebook_id": None,
        "sources_used": None,
        "error_message": None,
        "created_at": datetime.utcnow().isoformat(),
    }
    _generation_logs.append(log)
    return log


def update_generation_log(generation_id: str, status: str = None, error: str = None, **kwargs):
    """Update a generation log."""
    for log in _generation_logs:
        if log["id"] == generation_id:
            if status:
                log["status"] = status
            if error:
                log["error_message"] = error
            if status == "fetching":
                log["started_at"] = datetime.utcnow().isoformat()
            if status in ["complete", "failed"]:
                log["completed_at"] = datetime.utcnow().isoformat()
            # Update any additional fields
            log.update(kwargs)
            return log
    return None


# ============ User Preferences ============

def get_user_preferences(user_id: str) -> Dict:
    """Get user preferences."""
    print(f"[DEMO_STORE GET_PREFS] Getting preferences for user: {user_id}")
    print(f"[DEMO_STORE GET_PREFS] Current users in store: {list(_user_preferences.keys())}")

    if user_id not in _user_preferences:
        print(f"[DEMO_STORE GET_PREFS] User {user_id} NOT FOUND - Creating default preferences")
        # Create default preferences
        _user_preferences[user_id] = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "podcast_style": "deep-dive",
            "podcast_length": "medium",
            "language": "en",
            "timezone": "America/Los_Angeles",
            "daily_generation_enabled": False,
            "generation_time": Time(7, 0),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
        }
    else:
        print(f"[DEMO_STORE GET_PREFS] User {user_id} FOUND - Returning existing preferences")

    return _user_preferences[user_id]


def update_user_preferences(user_id: str, updates: Dict) -> Dict:
    """Update user preferences."""
    prefs = get_user_preferences(user_id)
    print(f"[DEMO_STORE] Before update - User {user_id}: daily_enabled={prefs.get('daily_generation_enabled')}")
    print(f"[DEMO_STORE] Applying updates: {updates}")
    prefs.update(updates)
    prefs["updated_at"] = datetime.utcnow().isoformat()
    print(f"[DEMO_STORE] After update - User {user_id}: daily_enabled={prefs.get('daily_generation_enabled')}")
    return prefs


def get_users_with_daily_generation_enabled() -> List[Dict]:
    """Get all users who have daily generation enabled."""
    return [
        prefs for prefs in _user_preferences.values()
        if prefs.get("daily_generation_enabled", False)
    ]
