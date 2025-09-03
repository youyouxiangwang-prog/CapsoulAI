from sqlalchemy import Column, Integer, String, DateTime, func, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.schemas.base import Base

class Speaker(Base):
    """说话人表，存储说话人信息"""
    __tablename__ = "speakers"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False, unique=True)
    aliases = Column(JSON)
    age = Column(Integer)
    sex = Column(String)
    relationship_type = Column(String)
    position = Column(String)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关系
    voiceprints = relationship("Voiceprint", back_populates="speaker")
