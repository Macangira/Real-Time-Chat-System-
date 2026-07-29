from typing import Optional

from pydantic import BaseModel

from app.models.chatroom import (
    ChatRoomStatus,
    ChatRoomType,
)


class CreateChatRoom(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    avatar: Optional[str] = None
    roomType: ChatRoomType = ChatRoomType.DIRECT
    createdBy: str


class UpdateChatRoom(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    avatar: Optional[str] = None
    roomType: Optional[ChatRoomType] = None
    status: Optional[ChatRoomStatus] = None
    isMuted: Optional[bool] = None