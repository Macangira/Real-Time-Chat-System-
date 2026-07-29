from app.models.comman import LogBase
from typing import Optional
from datetime import datetime 
from enum  import Enum
class Status(str, Enum):
    SEND = "send"
    DELIVERED = "delivered"
    READ = 'read'
    PENDING = "pending"
    FAILED ="failed"
class MessageType(str , Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    FILE = "file"
    LOCATION = "location"

class Chat(LogBase):
    chatRoomId : str
    senderId : str
    senderName : Optional[str] = None
    senderUsername : Optional[str] = None
    receiverId : str
    message : str
    messageType : MessageType = MessageType.TEXT
    status : Optional[Status] = Status.PENDING
    replyTo : Optional[str] = None
    isEdited : Optional[bool] = False
    editedAt : Optional[datetime] = None

    class Settings:
        name = "chat"
        indexes = [
            "senderId",
            "receiverId",
            "chatRoomId"
        ]