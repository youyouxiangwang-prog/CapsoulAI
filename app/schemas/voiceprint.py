from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from app.schemas.base import Base

class Voiceprint(Base):
    """声纹表，存储说话人声纹信息"""
    __tablename__ = "voiceprints"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    lineIdList = Column(JSON)
    speakerId = Column(Integer, ForeignKey("speakers.id"))
    confirmed = Column(Boolean, default=False)
    updatedTime = Column(DateTime(timezone=True), onupdate=func.now())
    embedding = Column(JSON)
    features = Column(Text, nullable=False)  # 声纹特征数据（JSON字符串）
    source_path = Column(String)  # 训练音频URL
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    speaker = relationship("Speaker", back_populates="voiceprints")
