from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from app.schemas.base import Base  # 保持你原来的 Base 引用

class Audio(Base):
    """音频表，存储音频文件元信息"""
    __tablename__ = "audios"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    source_path = Column(String)
    started_at = Column(DateTime(timezone=True))
    ended_at = Column(DateTime(timezone=True))
    status = Column(String)
    transcription_status = Column(String)
    analysis_status = Column(String)
    location = Column(String(50))
    participants = Column(JSON)
    name = Column(String(255))