from typing import List
from beanie import PydanticObjectId
from fastapi import HTTPException
from app.models.notification import Notification
from app.config.logger import logger

class NotificationService:
    @staticmethod
    async def create_notification(
        receiverId: str,
        senderId: str,
        messageId: str,
        message_type: str,
        title: str,
        body: str
    ) -> Notification:
        try:
            notification = Notification(
                receiverId=receiverId,
                senderId=senderId,
                messageId=messageId,
                type=message_type,
                title=title,
                body=body,
                isRead=False
            )
            await notification.insert()
            logger.info(f"Notification created for user: {receiverId}")
            return notification
        except Exception as e:
            logger.error(f"Failed to create notification: {str(e)}")
            return None

    @staticmethod
    async def get_user_notifications(userId: str) -> List[Notification]:
        try:
            return await Notification.find(
                Notification.receiverId == userId,
                Notification.deletedAt == None
            ).sort("-createdAt").to_list()
        except Exception as e:
            logger.error(f"Failed to get user notifications: {str(e)}")
            return []

    @staticmethod
    async def mark_as_read(notificationId: str) -> bool:
        try:
            notif = await Notification.find_one(
                Notification.id == PydanticObjectId(notificationId)
            )
            if notif:
                notif.isRead = True
                await notif.save()
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to mark notification read: {str(e)}")
            return False
