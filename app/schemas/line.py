from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func, Text
from sqlalchemy.orm import relationship
from app.schemas.base import Base

class Line(Base):
    """文本行表，存储转录的文本内容"""
    __tablename__ = "lines"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    speaker_id = Column(Integer, ForeignKey("speakers.id"))
    speaker_id_in_audio = Column(String(50))
    started_at = Column(DateTime(timezone=True))
    ended_at = Column(DateTime(timezone=True))
    text = Column(Text, nullable=False)
    audio_id = Column(Integer)
    segment_id = Column(Integer, ForeignKey("segments.id"), nullable=False)
    confidence = Column(Float)  # 置信度
    
    # 关系
    # segment = relationship("Segment", back_populates="lines")
