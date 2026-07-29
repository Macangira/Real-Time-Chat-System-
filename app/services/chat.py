from app.schema.chat import CreateChat , UpdateChat
from fastapi import HTTPException
from typing import List , Optional 
from beanie import PydanticObjectId
from datetime import datetime , timezone
from app.config.logger import logger
from app.models.chat import Chat , Status
from app.services.chatroom import ChatRoomService

class MessageServices:

    @staticmethod
    async def send_message(
        senderId : str,
        request : CreateChat
    ) -> Chat:
        try:
            from app.models.user import User
            sender_user = await User.find_one(User.id == PydanticObjectId(senderId))
            sender_name = f"{sender_user.first_name} {sender_user.last_name}" if sender_user else None
            sender_uname = sender_user.username if sender_user else None

            message = Chat(
                **request.model_dump(),
                senderId=senderId,
                senderName=sender_name,
                senderUsername=sender_uname,
                status=Status.SEND
            )
            
            await message.insert()

            # Update ChatRoom's lastMessage, lastMessageId, and lastMessageAt fields in Database
            await ChatRoomService.update_last_message(
                roomId=request.chatRoomId,
                messageId=str(message.id),
                message=request.message
            )

            return message
        except HTTPException:
            raise 
        except Exception as e:
            logger.error(f"Failed to create Message : {str(e)}")
            raise

    @staticmethod
    async  def get_messages(
        RoomId : str
    ) -> List[Chat]:
        try:
            from app.models.user import User
            conversations = await Chat.find(
                Chat.chatRoomId == RoomId,
                Chat.deletedAt == None
            ).sort("createdAt").to_list()

            if conversations:
                # Cache user lookups to populate missing senderName for older messages
                user_cache = {}
                for msg in conversations:
                    if not msg.senderName and msg.senderId:
                        if msg.senderId not in user_cache:
                            try:
                                u = await User.find_one(User.id == PydanticObjectId(msg.senderId))
                                user_cache[msg.senderId] = (f"{u.first_name} {u.last_name}", u.username) if u else (None, None)
                            except Exception:
                                user_cache[msg.senderId] = (None, None)
                        name, uname = user_cache[msg.senderId]
                        if name:
                            msg.senderName = name
                            msg.senderUsername = uname

            return conversations if conversations else []
        except HTTPException:
            raise 
        except Exception as e:
            logger.error(f"Failed to get messages : {str(e)}")
            raise
    @staticmethod
    async def get_message_by_id(
        messageId : str,
    ) -> Chat:
        try:
            message = await Chat.find_one(
                Chat.id == PydanticObjectId(messageId)
            )

            if not message:
                raise HTTPException(status_code=404 , detail= "Message Not Found")

            return message
        except HTTPException:
            raise 
        except Exception as e:
            logger.error(f"Failed to get conversation : {str(e)}")
            raise
    @staticmethod 
    async def edit_message(
        messageId : str,
        request : UpdateChat
    ) -> Chat:
        try:
            message = await Chat.find_one(
                Chat.id == PydanticObjectId(messageId),
                Chat.deletedAt == None
            )

            if not message :
                raise HTTPException(
                    status_code=404,
                    detail="Message Not Found"
                )

            message.message = request.message
            message.messageType = request.messageType
            message.isEdited = True
            message.editedAt = datetime.now(timezone.utc)

            await message.save()
            logger.info(f"Message Edit in DB successfully")

            return message
        
        except HTTPException:
            raise 
        except Exception as e:
            logger.error(f"Failed to Edit Message : {str(e)}")
            raise

    @staticmethod 
    async def delete_message(
        messageId : str
    ) -> dict:
        try:
            message = await Chat.find_one(
                Chat.id == PydanticObjectId(messageId),
                Chat.deletedAt == None
            )
            if not message:
                raise HTTPException(status_code=404 , detail="Message Not Found")
            
            message.deletedAt = datetime.now(timezone.utc)
            await message.save()

            return {
                "message" : "Deleted Successfully"
            }
        except HTTPException:
            raise 
        except Exception as e:
            logger.error(f"Failed to Delete Message : {str(e)}")
            raise
    @staticmethod
    async def mark_as_read(
        messageId : str
    ) -> Chat:
        try:
            message = await Chat.find_one(
                Chat.id == PydanticObjectId(messageId),
                Chat.deletedAt == None
            )

            if not message:
                raise HTTPException(
                    status_code= 404,
                    detail="Message Not Found"
                )

            message.status = Status.READ

            await message.save()
            return message
        except HTTPException:
            raise 
        except Exception as e:
            logger.error(f"Failed to mark read a message : {str(e)}")
            raise

    @staticmethod
    async def update_status(
        messageId :str,
        status : Status
    ) -> Chat:
        try:
            message = await Chat.find_one(
                Chat.id == PydanticObjectId(messageId),
                Chat.deletedAt == None
            )

            if not message:
                raise HTTPException(
                    status_code=404,
                    detail="Message Not Found"
                )

            message.status = status
            await message.save()

            return message
        except HTTPException:
            raise 
        except Exception as e:
            logger.error(f"Failed to Update Message : {str(e)}")
            raise