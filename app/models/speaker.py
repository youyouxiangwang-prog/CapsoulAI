from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SpeakerBase(BaseModel):
    name: str
    description: Optional[str] = None

class SpeakerCreate(SpeakerBase):
    pass

class SpeakerRead(SpeakerBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class VoiceprintBase(BaseModel):
    features: str  # JSON string of voice features
    source_path: Optional[str] = None

class VoiceprintCreate(VoiceprintBase):
    pass

class VoiceprintRead(VoiceprintBase):
    id: int
    speaker_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
