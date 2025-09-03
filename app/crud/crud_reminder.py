from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.schemas.reminder import Reminder
from sqlalchemy import or_

class CRUDReminder:
    def create(self, db: Session, obj_in: Dict[str, Any]) -> Reminder:
        db_obj = Reminder(**obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    def get(self, db: Session, id: int) -> Reminder:
        return db.query(Reminder).filter(Reminder.id == id).first()
    def get_multi(self, db: Session, skip=0, limit=100) -> List[Reminder]:
        return db.query(Reminder).offset(skip).limit(limit).all()
    def get_multi_by_segment_id(
        self,
        db: Session,
        tenant_id: int,
        segment_id: int
    ):
        return (
            db.query(Reminder)
            .filter(Reminder.tenant_id == tenant_id,
                    Reminder.segment_id == segment_id)
            .all()
        )
    def get_multi_by_tenant_id(
        self,
        db: Session,
        tenant_id: int
    ):
        return (
            db.query(Reminder)
            .filter(Reminder.tenant_id == tenant_id)
            .all()
        )
    def update(self, db: Session, db_obj, obj_in: Dict[str, Any]):
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    def remove(self, db: Session, id: int) -> Reminder:
        obj = db.query(Reminder).get(id)
        db.delete(obj)
        db.commit()
        return obj

    def search_by_keywords(self, db: Session, *, keywords: str, tenant_id: int, time_range: Optional[Dict[str, str]] = None, offset: int = 0, limit: int = 20) -> List[Reminder]:
        """
        Search reminders by keywords in title or content.
        """
        query = db.query(Reminder).filter(Reminder.tenant_id == tenant_id)
        
        if keywords:
            search_term = f"%{keywords}%"
            query = query.filter(
                or_(
                    Reminder.content.ilike(search_term)
                )
            )
            
        return query.offset(offset).limit(limit).all()

crud_reminder = CRUDReminder()
