from supabase import create_client, Client
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import Settings, get_settings

security = HTTPBearer()


def get_supabase_client(settings: Settings) -> Client:
    """Get Supabase client with service key for admin operations."""
    return create_client(settings.supabase_url, settings.supabase_service_key)


def get_supabase_anon_client(settings: Settings) -> Client:
    """Get Supabase client with anon key for user operations."""
    return create_client(settings.supabase_url, settings.supabase_anon_key)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings),
) -> str:
    """Validate JWT token and return authenticated user ID."""
    try:
        token = credentials.credentials

        # Verify JWT token with Supabase
        supabase = get_supabase_anon_client(settings)
        user = supabase.auth.get_user(token)

        if not user or not user.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = user.user.id
        print(f"[AUTH] Authenticated user_id: {user_id}")

        return user_id

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
