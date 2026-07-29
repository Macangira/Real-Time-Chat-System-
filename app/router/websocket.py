from fastapi import APIRouter  , WebSocket , WebSocketDisconnect , HTTPException
from app.websocket.connection_manager import manager
from app.websocket.websocket_service import WebSocketService
from app.websocket.websocket_handler import WebSocketHandler
router = APIRouter(
    tags=["websocket"]
)

@router.websocket("/ws/{userId}")
async def websocket_endpoint(websocket: WebSocket , userId : str):
    await manager.connect(userId , websocket)
    try:
        while True:
            data = await websocket.receive_json()
            print(f"Received from {userId}: {data}")
            await WebSocketHandler.handle(data)
    except WebSocketDisconnect:
        manager.disconnect(userId)
