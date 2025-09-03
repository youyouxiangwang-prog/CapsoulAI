from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class ExportJobStatus(BaseModel):
    job_id: str
    status: str  # pending, processing, completed, failed
    progress: Optional[int] = 0
    file_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
