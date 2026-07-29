from datetime import datetime
from enum import Enum
from typing import List, Optional

from app.models.comman import LogBase

class ChatRoomStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    CLOSED = "closed"

class ChatRoomType(str, Enum):
    DIRECT = "direct"      
    GROUP = "group"       




class ChatRoom(LogBase):

    name : Optional[str] = None
    description : Optional[str] = None
    avatar : Optional[str] = None

    roomType : ChatRoomType = ChatRoomType.DIRECT

    createdBy : str


    lastMessageId : Optional[str] = None
    lastMessage : Optional[str] = None
    lastMessageAt : Optional[datetime] = None

    status : ChatRoomStatus = ChatRoomStatus.ACTIVE

    isMuted : bool = False

    