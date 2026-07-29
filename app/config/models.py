
from app.models.user import User
from app.models.chatroom import ChatRoom 
from app.models.chat import Chat
from app.models.notification import Notification
from app.models.opt import OTP


def get_models():
    return [
        User,
        ChatRoom,
        Chat,
        Notification,
        OTP
    ]