from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.chat import MessageType 

class CreateChat(BaseModel):
    chatRoomId : str
    receiverId : str
    message: str
    messageType : MessageType = MessageType.TEXT
    replyTo : Optional[str] = None


class UpdateChat(BaseModel):
    message : str
    messageType : Optional[MessageType] = None

class ReadMessage(BaseModel):
    messageId : str
