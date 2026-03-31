import os
import httpx
import json
import logging
import mimetypes
from datetime import datetime, timedelta
from typing import List, Dict, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
CLIENT_ID = os.getenv("DIGINK_CLIENT_ID")
CLIENT_SECRET = os.getenv("DIGINK_CLIENT_SECRET")
APP_ID = os.getenv("DIGINK_APP_ID")
BASE_URL = os.getenv("DIGINK_BASE_URL", "https://api.digink.oxinus.io").rstrip("/")

# Token cache
_token_cache = {
    "access_token": None,
    "expires_at": None
}

async def get_access_token() -> str:
    """Gets a valid access token, using cache if possible."""
    now = datetime.utcnow()
    
    if _token_cache["access_token"] and _token_cache["expires_at"] > now + timedelta(minutes=5):
        return _token_cache["access_token"]

    logger.info("Requesting new DigInk access token...")
    url = f"{BASE_URL}/api/applications/token"
    payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            _token_cache["access_token"] = data["access_token"]
            # If expires_in is provided (e.g. 3600), use it. Default to 1 hour if not.
            expires_in = data.get("expires_in", 3600)
            _token_cache["expires_at"] = now + timedelta(seconds=expires_in)
            
            logger.info("New DigInk token acquired successfully.")
            return _token_cache["access_token"]
        except Exception as e:
            logger.error(f"Failed to get DigInk access token: {str(e)}")
            raise

async def create_document(
    sender_email: str,
    title: str,
    file_path: str,
    recipients: List[Dict[str, str]],
    fields: List[Dict] = None
) -> Dict:
    """Creates a document in DigInk for signing."""
    if not CLIENT_ID or not CLIENT_SECRET:
        logger.error("DigInk credentials are missing. Check your .env file.")
        raise ValueError("DigInk configuration is incomplete.")

    token = await get_access_token()
    url = f"{BASE_URL}/api/client/{CLIENT_ID}/documents"
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    if fields is None:
        # Default signature field at the bottom of first page if not specified
        fields = []
        for r in recipients:
            if r.get("role") == "signer":
                fields.append({
                    "type": "signature",
                    "label": "Signature",
                    "recipient_email": r["email"],
                    "page": 1,
                    "x": 400,
                    "y": 700,
                    "width": 100,
                    "height": 50
                })

    # Prepare multipart/form-data
    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "application/pdf" if file_path.endswith('.pdf') else "application/octet-stream"
        
    files = {
        "file": (os.path.basename(file_path), open(file_path, "rb"), mime_type)
    }
    
    data = {
        "sender_email": sender_email,
        "title": title,
        "recipients": json.dumps(recipients),
        "fields": json.dumps(fields)
    }
    
    async with httpx.AsyncClient() as client:
        try:
            logger.info(f"Uploading document '{title}' (MIME: {mime_type}) to DigInk...")
            response = await client.post(
                url, 
                headers=headers, 
                data=data, 
                files=files,
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"Document created successfully: {result.get('id')}")
            return result
        except Exception as e:
            error_msg = f"Failed to create DigInk document: {str(e)}"
            if hasattr(e, 'response') and e.response:
                error_msg += f" | Response: {e.response.text}"
            logger.error(error_msg)
            raise Exception(error_msg)
        finally:
            files["file"][1].close()

async def get_document_status(document_id: str) -> Dict:
    """Polls for document status."""
    token = await get_access_token()
    url = f"{BASE_URL}/api/client/{APP_ID}/documents/{document_id}"
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=10.0)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Failed to get DigInk document status: {str(e)}")
            raise
