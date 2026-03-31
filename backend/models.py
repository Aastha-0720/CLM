from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate)
            ])
        ])

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

class ReviewComment(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    contractId: str
    department: str
    clauseId: Optional[str] = None
    comment: str
    commentedBy: str
    status: str = "Comment"
    parentId: Optional[str] = None
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ReviewData(BaseModel):
    status: str = "Pending"
    comments: str = ""
    reviewedBy: str = ""
    reviewedAt: Optional[str] = None

class DepartmentReviews(BaseModel):
    Legal: ReviewData = Field(default_factory=ReviewData)
    Finance: ReviewData = Field(default_factory=ReviewData)
    Compliance: ReviewData = Field(default_factory=ReviewData)
    Procurement: ReviewData = Field(default_factory=ReviewData)

class Contract(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    title: str
    company: str
    value: float
    department: str
    stage: str = "Under Review"
    status: str = "Pending"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    submittedBy: str = "Admin"
    reviews: DepartmentReviews = Field(default_factory=DepartmentReviews)
    duration: Optional[str] = None
    category: Optional[str] = None
    risk_classification: Optional[str] = None
    business_unit: Optional[str] = None
    contract_owner: Optional[str] = None
    expiry_date: Optional[str] = None
    clauses: List[dict] = Field(default_factory=list)
    review_mode: str = "sequential"
    required_reviewers: List[str] = Field(default_factory=list)
    escalated: bool = False
    escalatedBy: Optional[str] = None
    escalatedAt: Optional[str] = None
    escalationReason: Optional[str] = None
    draftText: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class CASStep(BaseModel):
    role: str
    name: str
    status: str = "Pending"
    timestamp: Optional[str] = None
    approvedBy: Optional[str] = None

class CAS(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    contractId: str
    contractTitle: str
    value: float
    initiator: str
    status: str = "Pending Approval"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    doaApprover: str = ""
    businessUnit: str = ""
    department: str = ""
    agreementType: str = "Master Service Agreement"
    keyNotes: str = ""
    approvalChain: List[dict] = Field(default_factory=list)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Document(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    contractId: str
    fileName: str
    fileType: str
    fileSize: int
    storagePath: str
    version: int = 1
    uploadedBy: str = "Admin"
    uploadedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    category: str = "General"
    tags: List[str] = Field(default_factory=list)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class SystemLog(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    action: str
    user: str
    role: str
    details: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    email: str
    role: str
    password: str
    status: str = "Active"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class WhitelistEntry(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    domain: str  # lowercase, unique
    isActive: bool = True
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class DigInkDocument(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    contractId: str
    diginkDocumentId: str
    status: str = "Pending"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
