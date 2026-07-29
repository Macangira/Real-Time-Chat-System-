from collections import defaultdict
from fastapi import WebSocket

class ConnectionManager:

    def __init__(self):
        self.active_connections : dict[str,WebSocket] = {}
        self.rooms : dict[str , set[str]] = defaultdict(set)

    async def connect(self, userId: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[userId] = websocket

    def disconnect(self, userId: str):
        self.active_connections.pop(userId , None)

        for room in self.rooms.values():
            room.discard(userId)

    def join_room(self , roomId:str , userId : str):
        self.rooms[roomId].add(userId)

    def leave_room(self , roomId : str, userId : str):
        if roomId in self.rooms:
            self.rooms[roomId].discard(userId)

    async def send_to_user(self , userId : str , data : dict ):
        ws = self.active_connections.get(userId)
        if ws:
            await ws.send_json(data)

    async def broadcast_room( self, roomId : str , data : dict):

        members = self.rooms.get(roomId , set())
        for member in members:
            ws = self.active_connections.get(member)
            if ws:
                await ws.send_json(data)

manager = ConnectionManager()
        
