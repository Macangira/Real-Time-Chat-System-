from fastapi import APIRouter, Depends
from typing import List
from app.services.notification import NotificationService
from app.utils.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["Notification"])

@router.get("/")
async def get_my_notifications(current_user: User = Depends(get_current_user)):
    return await NotificationService.get_user_notifications(str(current_user.id))

@router.patch("/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: User = Depends(get_current_user)):
    success = await NotificationService.mark_as_read(notification_id)
    return {"success": success}
