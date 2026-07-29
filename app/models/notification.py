from app.models.comman import LogBase
from app.models.chat import MessageType
from typing import Optional
class Notification(LogBase):
    receiverId : str
    senderId : str
    messageId : str
    type : MessageType
    title : str
    body : str
    isRead : Optional[bool] = False