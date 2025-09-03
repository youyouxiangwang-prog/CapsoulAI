from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LineBase(BaseModel):
    text: str
    confidence: Optional[float] = None

class LineCreate(LineBase):
    segment_id: int

class LineRead(LineBase):
    id: int
    segment_id: int
    started_at: datetime
    
    class Config:
        from_attributes = True
