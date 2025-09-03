from sqlalchemy import Column, BigInteger, ForeignKey, TIMESTAMP, String, JSON
from app.core.database import Base
from pydantic import BaseModel
from typing import Optional

class TaskCreate(BaseModel):
    title: str
    content: Optional[str] = None
    status: Optional[str] = "pending"
    owner_id: int

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[int] = None

class TaskRead(BaseModel):
    id: int
    title: str
    content: Optional[str] = None
    status: str
    owner_id: int

    class Config:
        orm_mode = True
