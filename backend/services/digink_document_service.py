import os
import httpx
import json
import logging
from typing import List, Dict, Any
from fastapi import HTTPException, status, UploadFile
from services.digink_token_service import digink_token_service

# Configure logging
logger = logging.getLogger(__name__)

# Constants from environment
CLIENT_ID = os.getenv("DIGINK_CLIENT_ID")
# For DigInk API, CLIENT_ID or APP_ID might be required in the URL
# The prompt says: /api/client/{app_id}/documents
# I will use CLIENT_ID as the app_id representative if APP_ID is not set.
APP_ID = os.getenv("DIGINK_APP_ID") or CLIENT_ID
BASE_URL = os.getenv("DIGINK_BASE_URL", "https://api.digink.oxinus.io").rstrip("/")

class DigInkDocumentService:
    """
    Service to handle document-related operations with the DigInk API.
    """
    
    async def create_document(
        self,
        sender_email: str,
        title: str,
        file: UploadFile,
        recipients: List[Dict[str, Any]],
        fields: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Uploads a PDF and creates a signable document on DigInk.
        """
        try:
            # 1. Get the latest valid token (cached or refreshed)
            token = await digink_token_service.get_access_token()
            logger.info("Retrieved valid DigInk token for document creation.")

            # 2. Prepare the API request
            url = f"{BASE_URL}/api/client/{APP_ID}/documents"
            headers = {
                "Authorization": f"Bearer {token}"
            }

            # Prepare multipart/form-data
            # DigInk requires recipients and fields to be JSON strings
            payload = {
                "sender_email": sender_email,
                "title": title,
                "recipients": json.dumps(recipients),
                "fields": json.dumps(fields)
            }

            # Read file content for upload
            file_content = await file.read()
            files = {
                "file": (file.filename, file_content, "application/pdf")
            }

            logger.info(f"Sending document creation request to DigInk for '{title}'...")
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    url, 
                    headers=headers, 
                    data=payload, 
                    files=files,
                    timeout=30.0
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
                
                logger.info(f"DigInk Document created successfully: {result.get('id')}")
                return result

        except httpx.HTTPStatusError as exc:
            logger.error(f"DigInk API returned error: {exc.response.status_code} - {exc.response.text}")
            raise HTTPException(
                status_code=exc.response.status_code,
                detail=f"DigInk API error: {exc.response.text}"
            )
        except Exception as e:
            logger.error(f"Unexpected error in DigInk document service: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create DigInk document: {str(e)}"
            )

# Singleton instance
digink_document_service = DigInkDocumentService()
