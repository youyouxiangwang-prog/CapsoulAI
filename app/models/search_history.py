from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class SearchHistoryBase(BaseModel):
    query: str
    search_type: str  # basic, deep

class SearchHistoryCreate(SearchHistoryBase):
    user_id: int

class SearchHistoryRead(SearchHistoryBase):
    id: int
    user_id: int
    results_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True
