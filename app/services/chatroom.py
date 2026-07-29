from datetime import  datetime , timezone
from fastapi import HTTPException
from typing import Optional , List
from beanie import PydanticObjectId
from app.config.logger import logger
from app.models.chatroom import ChatRoom
from app.schema.chatroom import CreateChatRoom , UpdateChatRoom


class ChatRoomService:
    @staticmethod
    async def create_room(
        request : CreateChatRoom
    ) -> ChatRoom:
        try:
            room = ChatRoom(
                **request.model_dump(),
                lastMessageAt=datetime.now(timezone.utc)
            )
            await room.insert()
            return room
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to create conversation : {str(e)}")
            raise

    @staticmethod
    async def get_rooms() -> List[ChatRoom]:
        try:
            room  = await ChatRoom.find(ChatRoom.deletedAt == None).sort("-lastMessageAt", "-createdAt").to_list()
            return room if room else []
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get conversation : {str(e)}")
            raise

    @staticmethod
    async def get_room_by_id(
        roomId : str
    ) -> Optional[ChatRoom]:
        try:
            room =  await ChatRoom.find_one(
                ChatRoom.id == PydanticObjectId(roomId),
                ChatRoom.deletedAt == None
            )
            return room if room else {}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get conversation : {str(e)}")
            raise
    @staticmethod
    async def get_user_conversations(
        user_id : str
    ):
        try:
            user_conversation = await ChatRoom.find(
                {
                    "participants": user_id,
                    "is_deleted": False
                }
            ).sort("-updatedAt").to_list()

            return user_conversation if user_conversation else {}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get user conversation : {str(e)}")
            raise

    @staticmethod
    async def update_last_message(
        roomId : str,
        messageId : str,
        message : str, 
    ) -> Optional[ChatRoom]:
        try:
            room =await ChatRoomService.get_room_by_id(roomId)

            if not room:
                return None

            room.lastMessage = message
            room.lastMessageId = messageId
            room.lastMessageAt = datetime.now(timezone.utc)
            room.updatedAt = datetime.now(timezone.utc)

            await room.save()

            return room
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get user conversation : {str(e)}")
            raise
    @staticmethod
    async def delete(
        roomId : str
    ) -> bool:
        try:

            room = await ChatRoom.find(
                ChatRoom.id == PydanticObjectId(roomId),
                ChatRoom.deletedAt == None
            )

            if not room:
                return False

            room.deletedAt = datetime.now(timezone.utc)

            await room.save()

            return {
                "message": "Chat room deleted successfully."
            }

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get user conversation : {str(e)}")
            raise
    @staticmethod
    async def update_room(
        room_id: str,
        request: UpdateChatRoom
    ) -> ChatRoom:

        try:
            room = await ChatRoomService.get_room_by_id(room_id)
            data = request.model_dump(exclude_unset=True)
            for key, value in data.items():
                setattr(room, key, value)
            await room.save()
            return room
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get user conversation : {str(e)}")
            raise