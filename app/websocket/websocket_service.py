from app.websocket.connection_manager import manager
from app.services.chat import MessageServices
from app.services.notification import NotificationService
from app.schema.chat import CreateChat

class WebSocketService:
    @staticmethod
    async def join_room(
        roomId : str,
        userId : str
    ):
        manager.join_room(
            roomId,
            userId
        )
        await manager.send_to_user(
            userId,
            {
                "event" : "join_room",
                "roomId" : roomId
            }
        )

    @staticmethod 
    async def send_message(data : dict):
        senderId = data["senderId"]
        createdata = CreateChat(
            chatRoomId=data["chatRoomId"],
            receiverId=data["receiverId"],
            message=data["message"],
            messageType=data["messageType"]
        )
        chat = await MessageServices.send_message(senderId , createdata)
        msg_payload = {
            "event" : "new_message",
            "data" : chat.model_dump(mode="json")
        }

        # Broadcast new_message to all members in the chat room
        await manager.broadcast_room(data["chatRoomId"], msg_payload)

        # Save notification to Database via NotificationService
        receiver_id = data.get("receiverId")
        if receiver_id and receiver_id != senderId:
            sender_title = chat.senderName or "New Message"
            notif = await NotificationService.create_notification(
                receiverId=receiver_id,
                senderId=senderId,
                messageId=str(chat.id),
                message_type=data["messageType"],
                title=f"Message from {sender_title}",
                body=data["message"]
            )
            if notif:
                notif_payload = {
                    "event": "notification",
                    "data": notif.model_dump(mode="json")
                }
                await manager.send_to_user(receiver_id, notif_payload)

    @staticmethod
    async def typing(data : dict):
        await manager.broadcast_room(
            data["chatRoomId"],
            {
                "event" : "typing",
                "senderId" : data["senderId"]
            }
        )