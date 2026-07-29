from beanie import Document 
from pydantic import Field
from typing import Optional
from datetime import datetime , timezone
class LogBase(Document):
    createdAt : datetime = Field(default_factory=lambda : datetime.now(timezone.utc))
    updatedAt : datetime  = Field(default_factory=lambda: datetime.now(timezone.utc))
    deletedAt : Optional[datetime] = None
