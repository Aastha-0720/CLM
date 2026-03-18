from fastapi import APIRouter, HTTPException, status
from mongodb_client import db
from models import NotificationResponse, NotificationBase
from typing import List
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
async def get_notifications():
    notifications = await db.notifications.find().sort("created_at", -1).to_list(20)
    for n in notifications:
        n["_id"] = str(n["_id"])
    return notifications

@router.post("", response_model=NotificationResponse)
async def create_notification(notification: NotificationBase):
    notif_dict = notification.dict()
    result = await db.notifications.insert_one(notif_dict)
    notif_dict["_id"] = str(result.inserted_id)
    return notif_dict

@router.put("/{notif_id}/read")
async def mark_as_read(notif_id: str):
    result = await db.notifications.update_one(
        {"_id": ObjectId(notif_id)},
        {"$set": {"is_read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}
