from sqlalchemy.orm import Session
from typing import Optional, Any, Dict, Union
from app.schemas.tenant import Tenant

class CRUDTenant:
    """封装对`tenants`表的所有数据库操作"""
    def get_by_id(self, db: Session, *, id: str):
        return db.query(Tenant).filter(Tenant.id == id).first()

    def get_by_email(self, db: Session, *, email: str) -> Optional[Tenant]:
        return db.query(Tenant).filter(Tenant.email == email).first()

    def create(self, db: Session, *, obj_in: Union[Dict[str, Any], Any]) -> Tenant:
        if isinstance(obj_in, dict):
            db_obj = Tenant(**obj_in)
        else:
            db_obj = Tenant(**obj_in.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        return db_obj

    def update(self, db: Session, db_obj: Tenant, obj_in: Dict[str, Any]) -> Tenant:
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

crud_tenant = CRUDTenant()
