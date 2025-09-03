from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func, JSON, Text
from sqlalchemy.orm import relationship
from app.schemas.base import Base

class Conversation(Base):
    """对话表，存储录音会话信息"""
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    audio_id = Column(Integer, ForeignKey("audios.id"))  # 关联音频文件
    title = Column(String, nullable=False)
    topics = Column(String)
    summary = Column(Text)
    hashtags = Column(JSON)
    started_at = Column(DateTime(timezone=True))
    ended_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    segments = relationship("Segment", back_populates="conversation")
