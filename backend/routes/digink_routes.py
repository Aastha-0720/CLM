from fastapi import APIRouter, HTTPException, status, Form, UploadFile, File
from services.digink_token_service import digink_token_service
from services.digink_document_service import digink_document_service
from services.digink_send_service import digink_send_service
from models.document_model import DocumentDBModel, RecipientSchema, FieldSchema, DocumentSendRequest
from database import db
from datetime import datetime
import json
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/digink", tags=["DigInk"])

@router.get("/token")
async def get_digink_token():
    """
    Test endpoint to fetch and verify the DigInk access token.
    Uses caching and auto-refresh in the background.
    """
    try:
        token = await digink_token_service.get_access_token()
        
        # Return masked token for security in monitoring/testing
        masked = f"{token[:6]}...{token[-6:]}" if len(token) > 12 else "***"
        
        return {
            "access_token": token,  # Full token returned as requested for testing
            "masked": masked,
            "token_type": "bearer",
            "message": "Token fetched from cache or refreshed successfully."
        }
    except HTTPException as e:
        # Re-raise explicit HTTP errors
        raise e
    except Exception as e:
        logger.error(f"Failed to get DigInk token via route: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DigInk token service failure: {str(e)}"
        )

@router.post("/create-document")
async def create_digink_document(
    sender_email: str = Form(...),
    title: str = Form(...),
    recipients: str = Form(...), # JSON string
    fields: str = Form(...),     # JSON string
    file: UploadFile = File(...)
):
    """
    Uploads a PDF to DigInk, creates a document, and stores metadata in MongoDB.
    """
    logger.info(f"Incoming document creation request: '{title}' by {sender_email}")
    
    # 0. PDF MIME Type Validation
    if file.content_type != "application/pdf":
        logger.warning(f"File upload rejected: {file.content_type} is not application/pdf")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed.")

    try:
        # 1. Parse JSON strings
        try:
            recipients_json = json.loads(recipients)
            fields_json = json.loads(fields)
        except json.JSONDecodeError as de:
            logger.error(f"Invalid JSON format for recipients or fields: {str(de)}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON format for recipients or fields.")

        # 2. Validation
        if not recipients_json:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recipients list cannot be empty.")
        if not fields_json:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fields list cannot be empty.")

        # Check each field's recipient exists
        recipient_emails = {r.get("email") for r in recipients_json}
        for f in fields_json:
            if f.get("recipient_email") not in recipient_emails:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail=f"Recipient email '{f.get('recipient_email')}' in fields does not exist in recipients list."
                )

        # 3. Call Service Layer
        logger.info("Calling DigInk document service...")
        result = await digink_document_service.create_document(
            sender_email=sender_email,
            title=title,
            file=file,
            recipients=recipients_json,
            fields=fields_json
        )

        document_id = result.get("id")
        if not document_id:
            logger.error("DigInk API did not return a document ID.")
            raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="DigInk failed to return a valid document ID.")

        # 4. MongoDB Storage
        # Convert to Pydantic first for validation
        db_doc = DocumentDBModel(
            document_id=document_id,
            title=title,
            sender_email=sender_email,
            recipients=[RecipientSchema(**r) for r in recipients_json],
            fields=[FieldSchema(**f) for f in fields_json],
            status="draft",
            created_at=datetime.utcnow()
        )
        
        logger.info(f"Storing document metadata for ID {document_id} in MongoDB...")
        await db.documents.insert_one(db_doc.model_dump())
        logger.info("Database insertion successful.")

        return {
            "success": True,
            "document_id": document_id,
            "message": "Document created and stored successfully.",
            "digink_response": result
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to create document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Internal system error: {str(e)}"
        )

@router.post("/send-document")
async def send_digink_document(request: DocumentSendRequest):
    """
    Sends a pre-created document for signing.
    1. Fetches from MongoDB
    2. Verifies sender_email
    3. Calls DigInk API
    4. Updates status in DB
    """
    logger.info(f"Incoming send request for document ID: {request.document_id} by {request.sender_email}")
    
    try:
        # 1. Fetch from MongoDB to verify existence and ownership
        doc = await db.documents.find_one({"document_id": request.document_id})
        if not doc:
            logger.error(f"Document {request.document_id} not found in database.")
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
        
        # 2. IDEMPOTENCY CHECK
        if doc.get("status") == "sent":
            logger.info(f"Document {request.document_id} is already in 'sent' status. Skipping API call.")
            return {
                "success": True,
                "document_id": request.document_id,
                "status": "sent",
                "sent_at": doc.get("sent_at").isoformat() if doc.get("sent_at") else None,
                "message": "Document already sent for signing."
            }

        # 3. Verify sender_email matches stored record
        if doc.get("sender_email") != request.sender_email:
            logger.warning(f"Sender email mismatch: {request.sender_email} != {doc.get('sender_email')}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Sender email doesn't match the original document creator."
            )

        # 3. Trigger Send via Service
        result = await digink_send_service.send_document(
            document_id=request.document_id,
            sender_email=request.sender_email
        )

        # 4. Update MongoDB status to 'sent'
        logger.info(f"Updating MongoDB status for {request.document_id}...")
        now = datetime.utcnow()
        await db.documents.update_one(
            {"document_id": request.document_id},
            {
                "$set": {
                    "status": "sent",
                    "sent_at": now
                }
            }
        )
        logger.info(f"Document status updated successfully for {request.document_id}.")

        return {
            "success": True,
            "document_id": request.document_id,
            "status": "sent",
            "sent_at": now.isoformat(),
            "message": "Document sent for signing successfully.",
            "digink_response": result
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to send document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"System error while sending document: {str(e)}"
        )
