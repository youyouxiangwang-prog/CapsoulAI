from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from app.schemas.base import Base

class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    segment_id = Column(Integer, ForeignKey("segments.id"), nullable=False)
    created_at = Column(DateTime)
    started_at = Column(DateTime)
    ended_at = Column(DateTime)
    content = Column(String(255))
    temporal = Column(String(50))
    status = Column(String(50))
    related_people = Column(String(50))
    content = Column(String(255))
    line_ids = Column(JSON)
