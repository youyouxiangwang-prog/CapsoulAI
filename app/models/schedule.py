from pydantic import BaseModel
from typing import Optional

class ScheduleCreate(BaseModel):
    title: str
    content: Optional[str] = None
    status: Optional[str] = "pending"
    owner_id: int

class ScheduleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[int] = None

class ScheduleRead(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    status: str
    owner_id: int

    class Config:
        orm_mode = True