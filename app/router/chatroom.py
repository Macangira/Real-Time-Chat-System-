from fastapi import APIRouter , Depends  , HTTPException
from app.utils.deps import get_current_user
from app.models.user import User
from app.config.logger import logger
from app.schema.chatroom import ChatRoomStatus , CreateChatRoom , UpdateChatRoom
from app.services.chatroom import ChatRoomService


router = APIRouter(prefix="/chat-rooms", tags=["ChatRoom"])

@router.post("/")
async def create_chat_room(request : CreateChatRoom):
    return await ChatRoomService.create_room(request)

@router.get("/")
async def get_chat_rooms():
    return await ChatRoomService.get_rooms()
    

@router.get("/{roomId}")
async def get_chat_room(roomId: str):
    return await ChatRoomService.get_room_by_id(roomId)

@router.patch("/{room_id}")
async def update_chat_room(
    roomId : str,
    request : UpdateChatRoom
):
    return await ChatRoomService.update_room(
        roomId,request
    )

@router.delete("/{roomId}")
async def delete_chat_room(room_id : str):
    return await ChatRoomService.delete_room(room_id)