from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func, JSON
from sqlalchemy.orm import relationship
from app.schemas.base import Base

class UserActivityLog(Base):
    """用户活动日志表"""
    __tablename__ = "user_activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    activity_type = Column(String)
    target_entity = Column(String)
    target_id = Column(String)
    details = Column(String)
    action = Column(String, nullable=False)  # 操作类型
    resource_type = Column(String)  # 资源类型
    resource_id = Column(Integer)   # 资源ID
    activity_metadata = Column(JSON)  # 操作元数据
    created_at = Column(DateTime(timezone=True), server_default=func.now())
