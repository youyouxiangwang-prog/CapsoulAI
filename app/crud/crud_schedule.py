from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.schemas.schedule import Schedule
from sqlalchemy import or_
from datetime import datetime

class CRUDSchedule:
    def create(self, db: Session, obj_in: Dict[str, Any]) -> Schedule:
        db_obj = Schedule(**obj_in)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    def get(self, db: Session, id: int) -> Schedule:
        return db.query(Schedule).filter(Schedule.id == id).first()
    def get_multi(self, db: Session, skip=0, limit=100) -> List[Schedule]:
        return db.query(Schedule).offset(skip).limit(limit).all()
    def get_multi_by_segment_id(
        self,
        db: Session,
        tenant_id: int,
        segment_id: int
    ):
        return (
            db.query(Schedule)
            .filter(Schedule.tenant_id == tenant_id,
                    Schedule.segment_id == segment_id)
            .all()
        )
    def get_multi_by_tenant_id(
        self,
        db: Session,
        tenant_id: int
    ):
        return (
            db.query(Schedule)
            .filter(Schedule.tenant_id == tenant_id)
            .all()
        )
    def update(self, db: Session, db_obj, obj_in: Dict[str, Any]):
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    def remove(self, db: Session, id: int) -> Schedule:
        obj = db.query(Schedule).get(id)
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
    ) -> List[Schedule]:
        """
        Search schedules by keywords in title or description, with an optional time range filter.
        """
        query = db.query(Schedule).filter(Schedule.tenant_id == tenant_id)
        
        if keywords:
            search_term = f"%{keywords}%"
            query = query.filter(
                or_(
                    Schedule.content.ilike(search_term),
                )
            )
        
        if time_range and time_range.get("start") and time_range.get("end"):
            try:
                start_time = datetime.fromisoformat(time_range["start"])
                end_time = datetime.fromisoformat(time_range["end"])
                # Schedules have start_time and end_time, we can check for overlap
                if hasattr(Schedule, 'start_time') and hasattr(Schedule, 'end_time'):
                    query = query.filter(
                        or_(
                            Schedule.start_time.between(start_time, end_time),
                            Schedule.end_time.between(start_time, end_time)
                        )
                    )
            except (ValueError, TypeError):
                pass
            
        return query.offset(offset).limit(limit).all()

schedule = CRUDSchedule()

crud_schedule = CRUDSchedule()