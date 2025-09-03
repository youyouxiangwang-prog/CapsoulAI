from sqlalchemy import Column, Integer, String, DateTime, func, Text, JSON, ForeignKey
from app.schemas.base import Base

class Relationship(Base):
    """关系表，存储实体间的关系"""
    __tablename__ = "relationships"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)  # 租户ID
    segment_id_pointer = Column(Integer)  # 源段ID
    segment_id_target = Column(Integer)  # 目标段ID
    type = Column(String)  # 关系标签
    # source_type = Column(String, nullable=False)  # 源实体类型
    # source_id = Column(Integer, nullable=False)   # 源实体ID
    # target_type = Column(String, nullable=False)  # 目标实体类型
    # target_id = Column(Integer, nullable=False)   # 目标实体ID
    # relation_type = Column(String, nullable=False)  # 关系类型
    # relation_metadata = Column(JSON)  # 关系元数据
    # created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 添加索引以提高查询性能
    __table_args__ = (
        {'schema': None}  # 可以在这里添加索引定义
    )
