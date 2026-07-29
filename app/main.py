from fastapi import FastAPI , status , Request
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

from app.config.database import connect_to_mongo , close_mongo_connection
from app.router import(auth, chat, chatroom ,  websocket, notification)

@asynccontextmanager
async def lifespan(app : FastAPI):

    await connect_to_mongo()
    print("✅ DATABASE Connected")

    yield

    await close_mongo_connection()
    print("DataBase Disconnected")


app = FastAPI(
    title="Real time chat system",
    version="1.0.0",
    lifespan=lifespan,
)



app.add_middleware(

    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite React dev server
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "null",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(chatroom.router)
app.include_router(chat.router)
app.include_router(websocket.router)
app.include_router(notification.router)




@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"}
    )

'''
Command for python Run -> "python -m app.main"
'''
if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=3000,
        reload=True
    )