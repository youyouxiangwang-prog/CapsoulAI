from sqlalchemy.orm import Session
from sqlalchemy import text, or_
from typing import List, Optional, Any, Dict, Union
from datetime import datetime
from app.schemas.line import Line

class CRUDLine:
    """封装对`lines`表的操作"""
    
    def get(self, db: Session, id: int) -> Optional[Line]:
        """按ID查询"""
        return db.query(Line).filter(Line.id == id).first()
    
    def create(self, db: Session, *, obj_in: Union[Dict[str, Any], Any]) -> Line:
        """创建单条文本，插入前确保分区存在"""
        tenant_id = obj_in["tenant_id"] if isinstance(obj_in, dict) else obj_in.tenant_id
        # self.ensure_partition_for_tenant(db, str(tenant_id))
        if isinstance(obj_in, dict):
            db_obj = Line(**obj_in)
        else:
            db_obj = Line(**obj_in.dict())
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self,
        db: Session,
        *,
        db_obj: Line,
        obj_in: Union[Dict[str, Any], Any]
    ) -> Line:
        """更新文本行"""
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

    def bulk_create(self, db: Session, *, lines_data: List[Dict[str, Any]]) -> List[Line]:
        """批量创建文本 - 特有"""
        db_objs = [Line(**line_data) for line_data in lines_data]
        
        db.add_all(db_objs)
        db.commit()
        
        for db_obj in db_objs:
            db.refresh(db_obj)
        
        return db_objs
    
    def get_multi_by_segment(
        self,
        db: Session,
        *,
        segment_id: int,
        skip: int = 0
    ) -> List[Line]:
        """按分段ID查询文本行"""
        return (
            db.query(Line)
            .filter(Line.segment_id == segment_id)
            .order_by(Line.id.asc())
            .offset(skip)
            .all()
        )
    
    def get_by_conversation(
        self,
        db: Session,
        *,
        conversation_id: int,
        skip: int = 0
    ) -> List[Line]:
        """按对话ID查询所有文本行（通过JOIN）"""
        from app.schemas.segment import Segment
        
        return (
            db.query(Line)
            .join(Segment, Line.segment_id == Segment.id)
            .filter(Segment.conversation_id == conversation_id)
            .offset(skip)
            .all()
        )
    
    def search_text(
        self,
        db: Session,
        *,
        query: str,
        conversation_id: Optional[int] = None,
        skip: int = 0
    ) -> List[Line]:
        """搜索文本内容"""
        from app.schemas.segment import Segment
        
        db_query = db.query(Line).filter(Line.text.contains(query))
        
        if conversation_id:
            db_query = (
                db_query
                .join(Segment, Line.segment_id == Segment.id)
                .filter(Segment.conversation_id == conversation_id)
            )
        
        return db_query.offset(skip).all()
    
    def search_by_keywords(
        self, 
        db: Session, 
        *, 
        keywords: Optional[str], 
        tenant_id: int, 
        time_range: Optional[Dict[str, str]] = None, 
        offset: int = 0, 
        limit: int = 20
    ) -> List[Line]:
        """
        Search lines by keywords in text content, with an optional time range filter.
        """
        query = db.query(Line).filter(Line.tenant_id == tenant_id)
        
        if keywords:
            search_term = f"%{keywords}%"
            query = query.filter(Line.text.ilike(search_term))
        
        if time_range and time_range.get("start") and time_range.get("end"):
            try:
                start_time = datetime.fromisoformat(time_range["start"])
                end_time = datetime.fromisoformat(time_range["end"])
                # Use started_at field for time filtering if it exists
                if hasattr(Line, 'started_at'):
                    query = query.filter(Line.started_at.between(start_time, end_time))
            except (ValueError, TypeError):
                pass
            
        return query.offset(offset).limit(limit).all()
    
    def remove(self, db: Session, *, id: int) -> Optional[Line]:
        """删除文本行"""
        obj = db.query(Line).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj
    
    def get_multi_by_audio(
        self,
        db: Session,
        *,
        audio_id: int,
        skip: int = 0
    ) -> List[Line]:
        """按 audio_id 查询所有文本行"""
        return (
            db.query(Line)
            .filter(Line.audio_id == audio_id)
            .order_by(Line.id.asc())
            .offset(skip)
            .all()
        )
    
    def ensure_partition_for_tenant(self, db: Session, tenant_id: str):
        """
        确保 lines 表有对应 tenant_id 的分区（PostgreSQL 分区表），不存在时才创建。
        分区表主键 id 必须设置为自动递增（serial/bigserial），否则插入会报 not-null 错误。
        """
        partition_name = f"lines_{tenant_id.replace('-', '_')}"
        check_sql = f"""
        SELECT 1 FROM pg_inherits
        JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
        JOIN pg_class child ON pg_inherits.inhrelid = child.oid
        WHERE parent.relname = 'lines' AND child.relname = '{partition_name}'
        """
        result = db.execute(text(check_sql)).fetchone()
        if not result:
            create_sql = f"""
            CREATE TABLE {partition_name} PARTITION OF lines FOR VALUES IN ('{tenant_id}')
            """
            db.execute(text(create_sql))
            db.commit()

crud_line = CRUDLine()
