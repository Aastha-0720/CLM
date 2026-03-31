import os
import httpx
import logging
from typing import Dict, Any
from fastapi import HTTPException, status
from services.digink_token_service import digink_token_service

# Configure logging
logger = logging.getLogger(__name__)

# Constants from environment
CLIENT_ID = os.getenv("DIGINK_CLIENT_ID")
APP_ID = os.getenv("DIGINK_APP_ID") or CLIENT_ID
BASE_URL = os.getenv("DIGINK_BASE_URL", "https://api.digink.oxinus.io").rstrip("/")

class DigInkSendService:
    """
    Service to handle the 'Send Document' action for DigInk.
    """
    
    async def send_document(
        self,
        document_id: str,
        sender_email: str
    ) -> Dict[str, Any]:
        """
        Triggers the DigInk API to send a document for signing.
        """
        try:
            # 1. Get the latest valid token
            token = await digink_token_service.get_access_token()
            logger.info("Retrieved valid DigInk token for document sending.")

            # 2. Prepare the API request
            url = f"{BASE_URL}/api/client/{APP_ID}/documents/{document_id}/send"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            payload = {
                "sender_email": sender_email
            }

            logger.info(f"Sending request to DigInk for document ID '{document_id}'...")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url, 
                    headers=headers, 
                    json=payload,
                    timeout=20.0
                )
                
                # Check for 401 Specifically
                if response.status_code == 401:
                    logger.error("DigInk API unauthorized - token might have expired during request.")
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Invalid or expired DigInk token"
                    )

                response.raise_for_status()
                result = response.json()
                
                logger.info(f"DigInk Document {document_id} sent successfully.")
                return result

        except httpx.HTTPStatusError as exc:
            logger.error(f"DigInk API returned error during send: {exc.response.status_code} - {exc.response.text}")
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=f"DigInk API send error: {exc.response.text}"
            )
        except Exception as e:
            logger.error(f"Unexpected error in DigInk send service: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send DigInk document: {str(e)}"
            )

# Singleton instance
digink_send_service = DigInkSendService()
