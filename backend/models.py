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
