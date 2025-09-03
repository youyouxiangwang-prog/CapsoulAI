from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class ConversationBase(BaseModel):
    title: str
    tenant_id: str
    status: Optional[str] = "active"
    hashtags: Optional[List[str]] = []
    participants: Optional[List[str]] = []
    location: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

class ConversationCreate(ConversationBase):
    pass

class ConversationRead(ConversationBase):
    id: int
    owner_id: int
    audio_id: Optional[int] = None
    duration: Optional[float] = None
    transcription_status: str = "pending"
    analysis_status: str = "pending"
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ConversationDetails(ConversationRead):
    segments: List[Any] = []
    lines: List[Any] = []
    analysis_results: Optional[dict] = None
