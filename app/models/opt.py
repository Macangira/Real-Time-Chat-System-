from beanie import Document
from datetime import datetime
from typing import Optional

class OTP(Document):
    userId : str
    type : str
    otp : str
    expireAt : datetime
    isRevoked : Optional[bool] = False
    attempts : Optional[int] = 5
