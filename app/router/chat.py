from fastapi import APIRouter , Depends, HTTPException
from app.services.chat import MessageServices
from app.config.logger import logger
from typing import List
from app.models.chat import Status , Chat
from app.schema.chat import UpdateChat , MessageType , CreateChat 
from app.utils.deps import get_current_user

router = APIRouter(prefix="/messages", tags=["Message"])

@router.post("/" , response_model=Chat)
async def create_message(
    request : CreateChat,
    current_user = Depends(get_current_user)
):
    try:
        return await MessageServices.send_message(
            str(current_user.id),
            request
        )
    except HTTPException:
        raise 
    except Exception:
        raise HTTPException(status_code=500 , detail="Internal Server Error")

@router.get("/room/{RoomId}")
async def get_messages(RoomId: str):
    try:
        return await MessageServices.get_messages( RoomId)
    except HTTPException:
        raise 
    except Exception as e:
        raise HTTPException(status_code=500 , detail="Internal Server Error")

@router.get("/{messageId}")
async def get_message(
    messageId : str
):
    try:

        return await MessageServices.get_message_by_id(
            messageId
        )
    except HTTPException:
        raise 
    except Exception as e:
        raise HTTPException(status_code=500 , detail="Internal Server Error")


@router.put("/{messageId}", response_model=Chat)
async def edit_message(
    messageId: str , 
    request : UpdateChat
):
    try:
        return await MessageServices.edit_message(
            messageId,
            request
        )
    except HTTPException:
        raise 
    except Exception as e:
        raise HTTPException(status_code=500 , detail="Internal Server Error")


@router.delete("/{messageId}")
async def delete_message(messageId: str):
    try:
        return await MessageServices.delete_message(
            messageId
        )
    except HTTPException:
        raise 
    except Exception as e:
        raise HTTPException(status_code=500 , detail="Internal Server Error")


@router.patch("/{messageId}/mark_read" , response_model=Chat)
async def mark_as_read(messageId : str , ):
    try:
        return await MessageServices.mark_as_read(
            messageId
        )
    except HTTPException:
        raise 
    except Exception as e:
        raise HTTPException(status_code=500 , detail="Internal Server Error")

@router.patch("/{messageId}" , response_model=Chat)
async def update_status(messageId : str , status : Status):
    try:
        return await MessageServices.update_status(
            messageId,
            status
        )
    except HTTPException:
        raise 
    except Exception as e:
        raise HTTPException(status_code=500 , detail="Internal Server Error")

