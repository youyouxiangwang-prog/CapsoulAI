from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict, Union
from app.schemas.speaker import Speaker

class CRUDSpeaker:
    """封装对`speakers`表的操作"""
    
    def get(self, db: Session, id: int) -> Optional[Speaker]:
        """按ID查询"""
        return db.query(Speaker).filter(Speaker.id == id).first()
    
    def get_by_name(self, db: Session, *, name: str) -> Optional[Speaker]:
        """按名字查询 - 特有"""
        return db.query(Speaker).filter(Speaker.name == name).first()
    
    def create(self, db: Session, *, obj_in: Union[Dict[str, Any], Any]) -> Speaker:
        """创建说话人"""
        if isinstance(obj_in, dict):
            db_obj = Speaker(**obj_in)
        else:
            db_obj = Speaker(**obj_in.dict())
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self,
        db: Session,
        *,
        db_obj: Speaker,
        obj_in: Union[Dict[str, Any], Any]
    ) -> Speaker:
        """更新说话人"""
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
    
    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100
    ) -> List[Speaker]:
        """获取说话人列表"""
        return db.query(Speaker).offset(skip).limit(limit).all()
    
    def search_by_name(
        self,
        db: Session,
        *,
        name_pattern: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Speaker]:
        """按名字模式搜索说话人"""
        return (
            db.query(Speaker)
            .filter(Speaker.name.contains(name_pattern))
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def remove(self, db: Session, *, id: int) -> Optional[Speaker]:
        """删除说话人"""
        obj = db.query(Speaker).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

crud_speaker = CRUDSpeaker()
