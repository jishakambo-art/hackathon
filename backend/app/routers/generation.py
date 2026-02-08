from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from typing import List, Optional
from datetime import datetime

from app.config import get_settings, Settings
from app.schemas.generation import GenerationLog, GenerationStatus
from app.services.supabase import get_current_user
from app.services import demo_store
from app.services.podcast_generator import generate_podcast_for_user
from app.services.scheduler import check_and_generate_for_all_users

router = APIRouter()


@router.post("/generate", response_model=GenerationLog)
async def trigger_generation(
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Manually trigger podcast generation for the current user."""
    # Create generation log entry
    log = demo_store.create_generation_log(user_id)

    # Run generation in background
    background_tasks.add_task(
        generate_podcast_for_user,
        user_id=user_id,
        generation_id=log["id"],
        settings=settings,
    )

    return log


@router.get("/generations", response_model=List[GenerationLog])
async def get_generations(
    user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
    limit: int = 10,
):
    """Get generation history for the current user."""
    return demo_store.get_generation_logs(user_id, limit)


@router.get("/generations/{generation_id}", response_model=GenerationLog)
async def get_generation(
    generation_id: str,
    user_id: str = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Get status of a specific generation."""
    log = demo_store.get_generation_log(user_id, generation_id)

    if not log:
        raise HTTPException(status_code=404, detail="Generation not found")

    return log


@router.post("/cron/daily-generation")
async def cron_daily_generation(
    x_cron_secret: Optional[str] = Header(None),
    settings: Settings = Depends(get_settings),
):
    """
    Cron endpoint for daily podcast generation.

    This endpoint should be called every minute by a cron job.
    It checks all users with daily generation enabled and generates
    podcasts for those whose scheduled time has arrived.

    Optional: Protect with a secret header for security.
    """
    # Optional: Add security check
    # if settings.cron_secret and x_cron_secret != settings.cron_secret:
    #     raise HTTPException(status_code=401, detail="Unauthorized")

    result = await check_and_generate_for_all_users()

    return {
        "status": "success",
        "timestamp": datetime.utcnow().isoformat(),
        **result,
    }
