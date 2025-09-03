from pydantic import BaseModel
from typing import Optional

class VoiceprintBase(BaseModel):
    features: str  # JSON string of voice features
    source_path: Optional[str] = None

class VoiceprintCreate(VoiceprintBase):
    pass

class VoiceprintRead(VoiceprintBase):
    id: int
    speaker_id: int
    created_at: str
    
    class Config:
        from_attributes = True
