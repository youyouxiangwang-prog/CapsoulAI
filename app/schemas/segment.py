from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, func, String, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from app.schemas.base import Base

class Segment(Base):
    """音频分段表，存储音频的时间分段"""
    __tablename__ = "segments"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    started_at = Column(DateTime(timezone=True))
    ended_at = Column(DateTime(timezone=True))
    hashtags = Column(JSON)
    main_topic = Column(String)
    name_of_context = Column(JSON)
    speaker_role = Column(String)
    subcategory = Column(String)
    summary = Column(Text)
    title = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_relationship_analyzed = Column(Boolean, default=False)  # 是否已分析关系

    # 关系
    conversation = relationship("Conversation", back_populates="segments")
    # schedules = relationship("Schedule", back_populates="segments")
    # tasks = relationship("Task", back_populates="segments")
    # reminders = relationship("Reminder", back_populates="segments")
    # notes = relationship("Note", back_populates="segments")