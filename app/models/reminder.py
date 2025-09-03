from pydantic import BaseModel
from typing import Optional

class ReminderCreate(BaseModel):
    title: str
    content: Optional[str] = None
    status: Optional[str] = "pending"
    owner_id: int

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[int] = None

class ReminderRead(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    status: str
    owner_id: int

    class Config:
        orm_mode = True