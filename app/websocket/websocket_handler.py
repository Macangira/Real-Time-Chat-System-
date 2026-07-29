from app.websocket.websocket_service import WebSocketService

class WebSocketHandler:
    @staticmethod
    async def handle(data : dict):
        event = data.get("event")
        payload = data.get("data" ,{})

        if event == "join_room":
            await WebSocketService.join_room(
                payload["chatRoomId"],
                payload["userId"]
            )
        elif event == "send_message":
            await WebSocketService.send_message(payload)
        elif event == "typing":
            await WebSocketService.typing(payload)