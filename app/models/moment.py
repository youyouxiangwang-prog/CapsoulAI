from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime

class MomentRead(BaseModel):
    id: int
    type: str
    content: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class FilterRequest(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    types: Optional[List[str]] = None
    status: Optional[str] = None
    keywords: Optional[List[str]] = None

class RecommendationRequest(BaseModel):
    context: Optional[str] = None
    limit: int = 10

class GeneratedSummary(BaseModel):
    summary: str
    insights: List[str]
    recommendations: List[str]
    generated_at: datetime

from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class SearchQuery(BaseModel):
    query: str

class Node(BaseModel):
    id: str
    label: str
    type: str
    color: Optional[str] = None
    data: Dict[str, Any]

class Edge(BaseModel):
    from_: str  # Using from_ to avoid Python keyword conflict
    to: str
    label: str
    
    class Config:
        # This allows the model to accept 'from' as field name in JSON
        fields = {'from_': 'from'}
    
class SearchResult(BaseModel):
    summary: str
    ancestry_graphs: List[Dict[str, Any]] = []  # Contains complete ancestry graph information
    stats: Dict[str, Any] = {}

class AncestryRequest(BaseModel):
    entity_id: str
    entity_type: str

class AncestryChain(BaseModel):
    chain: List[Dict[str, Any]]

class AncestryResponse(BaseModel):
    task_ancestry_chains: List[AncestryChain]
