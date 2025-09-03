from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.schemas.note import Note
from sqlalchemy import or_
from datetime import datetime

class CRUDNote:
    def create(self, db: Session, obj_in: Dict[str, Any]) -> Note:
        db_obj = Note(**obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    def get(self, db: Session, id: int) -> Note:
        return db.query(Note).filter(Note.id == id).first()
    def get_multi(self, db: Session, skip=0, limit=100) -> List[Note]:
        return db.query(Note).offset(skip).limit(limit).all()
    def get_multi_by_segment_id(
        self,
        db: Session,
        tenant_id: int,
        segment_id: int
    ):
        return (
            db.query(Note)
            .filter(Note.tenant_id == tenant_id,
                    Note.segment_id == segment_id)
            .all()
        )
    def get_multi_by_tenant_id(
        self,
        db: Session,
        tenant_id: int
    ):
        return (
            db.query(Note)
            .filter(Note.tenant_id == tenant_id)
            .all()
        )
    def update(self, db: Session, db_obj, obj_in: Dict[str, Any]):
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    def remove(self, db: Session, id: int) -> Note:
        obj = db.query(Note).get(id)
        db.delete(obj)
        db.commit()
        return obj

    def search_by_keywords(
        self, 
        db: Session, 
        *, 
        keywords: Optional[str], 
        tenant_id: int, 
        time_range: Optional[Dict[str, str]] = None, 
        offset: int = 0, 
        limit: int = 20
    ) -> List[Note]:
        """
        Search notes by keywords in title or content, with an optional time range filter.
        """
        query = db.query(Note).filter(Note.tenant_id == tenant_id)
        
        if keywords:
            search_term = f"%{keywords}%"
            query = query.filter(
                or_(
                    Note.content.ilike(search_term)
                )
            )
        
        if time_range and time_range.get("start") and time_range.get("end"):
            try:
                start_time = datetime.fromisoformat(time_range["start"])
                end_time = datetime.fromisoformat(time_range["end"])
                if hasattr(Note, 'created_at'):
                    query = query.filter(Note.created_at.between(start_time, end_time))
            except (ValueError, TypeError):
                pass
            
        return query.offset(offset).limit(limit).all()

crud_note = CRUDNote()