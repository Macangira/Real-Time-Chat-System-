from app.models.comman import LogBase
from typing import Optional
from datetime import datetime
from pydantic import Field

class User(LogBase):
    username : str = Field(... , min_length=10 , max_length=20)
    first_name : str 
    last_name : str
    email : str
    password : str
    roleId : Optional[str] = "user"
    token : Optional[str] = None
    is_emailverified : Optional[bool] = False
    is_active : Optional[bool] = False
    last_login : Optional[datetime] = None

    class Settings:
        name = "users"
        indexes = [
            "username",
            "email",
            "roleId"
        ]
