"""
Main podcast generation orchestrator.

This service coordinates:
1. Fetching content from all sources
2. Creating a NotebookLM notebook
3. Generating the audio podcast
4. Updating generation status
"""

from datetime import datetime
from typing import Optional

from app.config import Settings
from app.services.supabase import get_supabase_client
from app.services.perplexity import get_news_for_topics
from app.services.rss import fetch_multiple_feeds
from app.services.notebooklm import (
    create_notebook_with_content,
    generate_audio_overview,
    format_content_for_notebook,
)


async def generate_podcast_for_user(
    user_id: str,
    generation_id: str,
    settings: Settings,
) -> None:
    """
    Generate a podcast for a specific user.

    This is the main orchestration function that:
    1. Fetches all user's sources
    2. Aggregates content
    3. Creates NotebookLM notebook
    4. Generates audio
    5. Updates status throughout
    """
    print(f"[GENERATION {generation_id}] ===== STARTING BACKGROUND TASK =====")
    print(f"[GENERATION {generation_id}] User ID: {user_id}")

    # Import db service
    from app.services import db

    def update_status(status: str, error: Optional[str] = None, **kwargs):
        try:
            updates = {"status": status}
            if error:
                updates["error_message"] = error
            updates.update(kwargs)
            print(f"[GENERATION {generation_id}] Updating status to: {status}")
            if error:
                print(f"[GENERATION {generation_id}] Error message: {error}")
            result = db.update_generation_log(generation_id=generation_id, updates=updates)
            print(f"[GENERATION {generation_id}] Status updated successfully")
            return result
        except Exception as e:
            print(f"[GENERATION {generation_id}] FAILED TO UPDATE STATUS: {str(e)}")
            import traceback
            traceback.print_exc()
            raise

    # Wrap everything in try-catch to catch any early failures
    try:
        # Update status to fetching
        print(f"[GENERATION {generation_id}] About to update status to 'fetching'")
        update_status("fetching")
        print(f"[GENERATION {generation_id}] Status updated to 'fetching' successfully")

        # Fetch user's sources from database
        rss_sources = [
            s for s in db.get_rss_sources(user_id)
            if s.get("enabled")
        ]

        news_topics = [
            t for t in db.get_news_topics(user_id)
            if t.get("enabled")
        ]

        # Fetch content from each source type
        rss_urls = [s["url"] for s in rss_sources]
        rss_entries = await fetch_multiple_feeds(rss_urls) if rss_urls else {}

        topic_names = [t["topic"] for t in news_topics]
        news_summaries = await get_news_for_topics(topic_names, settings) if topic_names else {}

        # Format content for NotebookLM
        print(f"[GENERATION {generation_id}] Fetched content - RSS: {len(rss_entries)}, Topics: {len(news_summaries)}")
        content_items = format_content_for_notebook(
            substack_posts=[],
            rss_entries=rss_entries,
            news_summaries=news_summaries,
        )

        print(f"[GENERATION {generation_id}] Formatted {len(content_items)} content items")

        if not content_items:
            update_status("failed", error="No content found from any sources")
            return

        # Update status to generating
        update_status("generating")
        print(f"[GENERATION {generation_id}] Creating NotebookLM notebook...")

        # Create NotebookLM notebook with custom title including topics
        today = datetime.utcnow().strftime("%Y-%m-%d")

        # Format title with topics
        if topic_names:
            if len(topic_names) == 1:
                topics_text = topic_names[0]
            elif len(topic_names) == 2:
                topics_text = f"{topic_names[0]} and {topic_names[1]}"
            else:
                topics_text = ", ".join(topic_names[:-1]) + f", and {topic_names[-1]}"
            notebook_title = f"Daily Brief - Topics {topics_text} - {today}"
        else:
            notebook_title = f"Daily Brief - {today}"

        notebook_result = await create_notebook_with_content(
            title=notebook_title,
            content_items=content_items,
            user_id=user_id,
        )

        if notebook_result["status"] == "error":
            update_status("failed", error=notebook_result.get("error", "Failed to create notebook"))
            return

        notebook_id = notebook_result["notebook_id"]
        print(f"[GENERATION {generation_id}] Notebook created: {notebook_id}")

        # Generate audio
        print(f"[GENERATION {generation_id}] Starting audio generation (may take up to 10 minutes)...")
        audio_result = await generate_audio_overview(
            notebook_id=notebook_id,
            user_id=user_id,
            format="deep-dive",
        )
        print(f"[GENERATION {generation_id}] Audio generation result: {audio_result.get('status')}")

        if audio_result["status"] == "error":
            update_status(
                "failed",
                error=audio_result.get("error", "Failed to generate audio"),
                notebook_id=notebook_id,
            )
            return

        # Success!
        update_status(
            "complete",
            notebook_id=notebook_id,
            sources_used={
                "rss_feeds": len(rss_entries),
                "news_topics": len(news_summaries),
                "total_items": len(content_items),
            },
        )

    except Exception as e:
        print(f"[GENERATION {generation_id}] ===== GENERATION FAILED =====")
        print(f"[GENERATION {generation_id}] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        try:
            update_status("failed", error=str(e))
        except Exception as update_error:
            print(f"[GENERATION {generation_id}] CRITICAL: Failed to update status to 'failed': {str(update_error)}")
            traceback.print_exc()


async def run_scheduled_generation(settings: Settings) -> None:
    """
    Run generation for all users with enabled sources.

    This is called by the cron job at 7am PT.
    """
    supabase = get_supabase_client(settings)

    # Get all users with at least one enabled source
    # This is a simplified query - in production you'd optimize this
    users_with_sources = (
        supabase.table("substack_sources")
        .select("user_id")
        .eq("enabled", True)
        .execute()
    ).data

    rss_users = (
        supabase.table("rss_sources")
        .select("user_id")
        .eq("enabled", True)
        .execute()
    ).data

    topic_users = (
        supabase.table("news_topics")
        .select("user_id")
        .eq("enabled", True)
        .execute()
    ).data

    # Combine unique user IDs
    user_ids = set()
    for source in users_with_sources + rss_users + topic_users:
        user_ids.add(source["user_id"])

    # Generate podcast for each user
    for user_id in user_ids:
        # Create generation log
        response = supabase.table("generation_logs").insert({
            "user_id": user_id,
            "scheduled_at": datetime.utcnow().isoformat(),
            "status": "scheduled",
        }).execute()

        generation_id = response.data[0]["id"]

        # Generate podcast (could parallelize this in production)
        await generate_podcast_for_user(user_id, generation_id, settings)
