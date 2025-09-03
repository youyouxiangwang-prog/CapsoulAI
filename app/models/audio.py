from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AudioBase(BaseModel):
    tenant_id: str  # uuid 类型用 str 表示
    source_path: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: Optional[str] = None
    transcription_status: Optional[str] = None
    analysis_status: Optional[str] = None
    location: Optional[str] = None
    participants: Optional[list[str]] = None
    name: Optional[str] = None


class AudioCreate(AudioBase):
    pass


class AudioRead(AudioBase):
    id: int  # bigint
    class Config:
        from_attributes = True
