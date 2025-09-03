from pydantic import BaseModel
from typing import Optional

class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = None
    status: Optional[str] = "pending"
    owner_id: int

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[int] = None

class NoteRead(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    status: str
    owner_id: int

    class Config:
        orm_mode = True