from sqlalchemy import Column, String, DateTime, func, JSON
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.schemas.base import Base
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class Tenant(Base):
    """租户表，存储系统多租户信息"""
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    google_id = Column(String, unique=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255))
    plan = Column(String(50), default="free")
    status = Column(String(50), default="active")
    settings = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True))

class TenantRead(BaseModel):
    id: str
    email: EmailStr
    name: Optional[str]
    plan: Optional[str]
    status: Optional[str]
    google_id: Optional[str]
    last_login_at: Optional[datetime]
    class Config:
        orm_mode = True
