import os
import time
import asyncio
import httpx
import logging
from typing import Optional, Dict
from fastapi import HTTPException, status

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants from environment
CLIENT_ID = os.getenv("DIGINK_CLIENT_ID")
CLIENT_SECRET = os.getenv("DIGINK_CLIENT_SECRET")
BASE_URL = os.getenv("DIGINK_BASE_URL", "https://api.digink.oxinus.io").rstrip("/")

class DigInkTokenService:
    """
    Service to manage DigInk API authentication tokens with caching and auto-refresh.
    """
    def __init__(self):
        self._access_token: Optional[str] = None
        self._expires_at: float = 0.0
        self._token_type: str = "bearer"
        self._lock = asyncio.Lock()

    async def get_access_token(self) -> str:
        """
        Returns a valid access token. Fetches a new one if not exists or expired.
        """
        async with self._lock:
            # Current time in seconds
            now = time.time()
            
            # Buffer to refresh 60 seconds before actual expiry to avoid race conditions
            buffer_seconds = 60
            
            # Check if we have a valid cached token
            if self._access_token and (now < self._expires_at - buffer_seconds):
                logger.info("DigInk token reused from cache.")
                return self._access_token

            # If we reach here, we need a new token (either missing or expired)
            action = "refreshed" if self._access_token else "generated"
            logger.info(f"DigInk token {action}...")
            
            return await self._fetch_new_token()

    async def _fetch_new_token(self) -> str:
        """
        Private method to call DigInk API for a new token.
        """
        if not CLIENT_ID or not CLIENT_SECRET:
            logger.error("DigInk Credentials are missing in .env")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="DigInk API configuration missing (CLIENT_ID/CLIENT_SECRET)"
            )

        token_url = f"{BASE_URL}/api/applications/token"
        payload = {
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(token_url, json=payload, timeout=10.0)
                
                # Handle 401 specifically
                if response.status_code == 401:
                    logger.error("DigInk API: 401 Unauthorized - Invalid credentials")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid DigInk credentials"
                    )
                
                response.raise_for_status()
                data = response.json()
                
                # Update cache
                self._access_token = data.get("access_token")
                self._token_type = data.get("token_type", "bearer")
                expires_in = data.get("expires_in", 3600)  # Default 1 hour if not provided
                
                # Calculate absolute expiry time
                self._expires_at = time.time() + float(expires_in)
                
                logger.info("New DigInk token acquired successfully.")
                return self._access_token

            except httpx.RequestError as exc:
                logger.error(f"Network error while fetching DigInk token: {str(exc)}")
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail=f"DigInk API unreachable: {str(exc)}"
                )
            except Exception as e:
                logger.error(f"Unexpected error fetching DigInk token: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Token service error: {str(e)}"
                )

# Singleton instance for the service
digink_token_service = DigInkTokenService()
