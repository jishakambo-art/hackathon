from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
import httpx

from app.config import get_settings, Settings
from app.schemas.auth import UserCreate, UserLogin, Token
from app.services.supabase import get_supabase_client, get_current_user

router = APIRouter()


@router.post("/signup", response_model=Token)
async def signup(user: UserCreate, settings: Settings = Depends(get_settings)):
    """Create a new user account."""
    supabase = get_supabase_client(settings)

    try:
        response = supabase.auth.sign_up({
            "email": user.email,
            "password": user.password,
        })

        if response.user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user",
            )

        return Token(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            token_type="bearer",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=Token)
async def login(user: UserLogin, settings: Settings = Depends(get_settings)):
    """Login with email and password."""
    supabase = get_supabase_client(settings)

    try:
        response = supabase.auth.sign_in_with_password({
            "email": user.email,
            "password": user.password,
        })

        return Token(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            token_type="bearer",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )


@router.get("/me")
async def get_current_user_info(user_id: str = Depends(get_current_user)):
    """Get current authenticated user information."""
    return {"user_id": user_id, "authenticated": True}


@router.get("/notebooklm/status")
async def get_notebooklm_status(
    user_id: str = Depends(get_current_user),
):
    """
    Check if user has authenticated with NotebookLM.

    Returns:
        Dict with authenticated status and metadata
    """
    from app.services.notebooklm_auth import notebooklm_auth

    is_auth = notebooklm_auth.is_authenticated(user_id)
    credentials = notebooklm_auth.get_user_credentials(user_id) if is_auth else None

    return {
        "authenticated": is_auth,
        "credentials": credentials,
    }


@router.post("/notebooklm/authenticate")
async def authenticate_notebooklm(
    user_id: str = Depends(get_current_user),
):
    """
    Initiate NotebookLM authentication via browser-based Google OAuth.

    This will:
    1. Launch a browser window for Google login
    2. User completes OAuth flow in browser
    3. Credentials are stored securely

    Note: This is a blocking operation that waits for user to complete OAuth.
    """
    from app.services.notebooklm_auth import notebooklm_auth

    result = await notebooklm_auth.authenticate_user(user_id)
    return result


@router.delete("/notebooklm/revoke")
async def revoke_notebooklm(
    user_id: str = Depends(get_current_user),
):
    """
    Revoke NotebookLM authentication for the user.

    This will delete stored credentials.
    """
    from app.services.notebooklm_auth import notebooklm_auth

    result = await notebooklm_auth.revoke_authentication(user_id)
    return result


@router.post("/notebooklm/upload-credentials")
async def upload_notebooklm_credentials(
    credentials_data: dict,
    user_id: str = Depends(get_current_user),
):
    """
    Upload NotebookLM credentials from desktop app.

    This endpoint receives credentials that were generated locally
    via the desktop app's browser automation.

    Expected payload:
    {
        "user_id": "user-id",
        "credentials": {
            "cookies": [...],
            "origins": [...]
        }
    }
    """
    from app.services.notebooklm_auth import notebooklm_auth
    import json
    from pathlib import Path

    try:
        print(f"[UPLOAD] Received credentials upload for user: {user_id}")
        print(f"[UPLOAD] Payload user_id: {credentials_data.get('user_id')}")

        # Verify user_id matches authenticated user
        if credentials_data.get('user_id') != user_id:
            print(f"[UPLOAD] User ID mismatch! Authenticated: {user_id}, Payload: {credentials_data.get('user_id')}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User ID mismatch"
            )

        credentials = credentials_data.get('credentials')
        if not credentials:
            print(f"[UPLOAD] No credentials in payload!")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No credentials provided"
            )

        print(f"[UPLOAD] Credentials payload has keys: {list(credentials.keys())}")

        # Save credentials to database
        from app.services import db
        db.save_notebooklm_credentials(user_id, credentials)

        print(f"[UPLOAD] Credentials saved to database for user: {user_id}")

        # Update cache
        from datetime import datetime
        metadata = {
            "user_id": user_id,
            "authenticated": True,
            "authenticated_at": datetime.utcnow().isoformat(),
        }
        notebooklm_auth._auth_cache[user_id] = metadata

        print(f"[UPLOAD] Successfully uploaded credentials for user: {user_id}")

        return {
            "status": "success",
            "message": "Credentials uploaded successfully",
            "authenticated": True,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[UPLOAD] Error uploading credentials: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload credentials: {str(e)}"
        )
