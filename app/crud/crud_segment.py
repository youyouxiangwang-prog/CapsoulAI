from sqlalchemy.orm import Session
from sqlalchemy import text, or_
from typing import List, Optional, Any, Dict, Union
from app.schemas.segment import Segment
from datetime import datetime

class CRUDSegment:
    """封装对`segments`表的操作"""
    
    def get(self, db: Session, id: int) -> Optional[Segment]:
        """按ID查询"""
        return db.query(Segment).filter(Segment.id == id).first()
    
    def get_multi_by_conversation(
        self, 
        db: Session, 
        *, 
        conversation_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Segment]:
        """按对话ID查询 - 特有"""
        return (
            db.query(Segment)
            .filter(Segment.conversation_id == conversation_id)
            .order_by(Segment.started_at)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def ensure_partition_for_tenant(self, db: Session, tenant_id: str):
        """
        确保 segments 表有对应 tenant_id 的分区（PostgreSQL 分区表），不存在时才创建。
        """
        partition_name = f"segments_{tenant_id.replace('-', '_')}"
        check_sql = f"""
        SELECT 1 FROM pg_inherits
        JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
        JOIN pg_class child ON pg_inherits.inhrelid = child.oid
        WHERE parent.relname = 'segments' AND child.relname = '{partition_name}'
        """
        result = db.execute(text(check_sql)).fetchone()
        if not result:
            create_sql = f"""
            CREATE TABLE {partition_name} PARTITION OF segments FOR VALUES IN ('{tenant_id}')
            """
            db.execute(text(create_sql))
            db.commit()
    
    def create(self, db: Session, *, obj_in: Union[Dict[str, Any], Any]) -> Segment:
        """创建分段"""
        tenant_id = obj_in["tenant_id"] if isinstance(obj_in, dict) else obj_in.tenant_id
        # self.ensure_partition_for_tenant(db, str(tenant_id))
        if isinstance(obj_in, dict):
            db_obj = Segment(**obj_in)
        else:
            db_obj = Segment(**obj_in.dict())
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self,
        db: Session,
        *,
        db_obj: Segment,
        obj_in: Union[Dict[str, Any], Any]
    ) -> Segment:
        """更新分段"""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_by_time_range(
        self,
        db: Session,
        *,
        conversation_id: int,
        start_time: float,
        end_time: float
    ) -> List[Segment]:
        """按时间范围查询分段"""
        return (
            db.query(Segment)
            .filter(
                Segment.conversation_id == conversation_id,
                Segment.start_time >= start_time,
                Segment.end_time <= end_time
            )
            .order_by(Segment.start_time)
            .all()
        )

    def search_by_keywords(
        self, 
        db: Session, 
        *, 
        keywords: Optional[str], 
        tenant_id: int, 
        time_range: Optional[Dict[str, str]] = None, 
        offset: int = 0, 
        limit: int = 20
    ) -> List[Segment]:
        """
        Search segments by keywords in summary or transcript, with an optional time range filter.
        """
        query = db.query(Segment).filter(Segment.tenant_id == tenant_id)
        
        if keywords:
            search_term = f"%{keywords}%"
            query = query.filter(
                or_(
                    Segment.summary.ilike(search_term),
                    Segment.subcategory.ilike(search_term),
                    Segment.main_topic.ilike(search_term)

                )
            )
        
        if time_range and time_range.get("start") and time_range.get("end"):
            try:
                start_time = datetime.fromisoformat(time_range["start"])
                end_time = datetime.fromisoformat(time_range["end"])
                # Assuming the model has a `start_time` field
                if hasattr(Segment, 'start_time'):
                    query = query.filter(Segment.start_time.between(start_time, end_time))
            except (ValueError, TypeError):
                # Silently ignore invalid time_range format
                pass
            
        return query.offset(offset).limit(limit).all()

crud_segment = CRUDSegment()
