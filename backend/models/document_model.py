from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class RecipientSchema(BaseModel):
    name: str
    email: EmailStr
    role: str = "signer"  # e.g., 'signer', 'viewer'

class FieldSchema(BaseModel):
    type: str = "signature" # 'signature', 'date', 'text'
    label: str
    recipient_email: EmailStr
    page: int
    x: int
    y: int
    width: int
    height: int

class DocumentCreateResponse(BaseModel):
    document_id: str
    title: str
    status: str = "draft"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DocumentDBModel(BaseModel):
    document_id: str
    title: str
    sender_email: EmailStr
    recipients: List[RecipientSchema]
    fields: List[FieldSchema]
    status: str = "draft"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    sent_at: Optional[datetime] = None

class DocumentSendRequest(BaseModel):
    document_id: str
    sender_email: EmailStr
