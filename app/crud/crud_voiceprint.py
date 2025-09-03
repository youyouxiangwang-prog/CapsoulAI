from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict, Union
from app.schemas.voiceprint import Voiceprint

class CRUDVoiceprint:
    """封装对`voiceprints`表的操作"""
    
    def get(self, db: Session, id: int) -> Optional[Voiceprint]:
        """按ID查询"""
        return db.query(Voiceprint).filter(Voiceprint.id == id).first()
    
    def get_by_speaker_id(self, db: Session, *, speaker_id: int) -> Optional[Voiceprint]:
        """按说话人ID查询 - 特有"""
        return db.query(Voiceprint).filter(Voiceprint.speaker_id == speaker_id).first()
    
    def create(self, db: Session, *, obj_in: Union[Dict[str, Any], Any]) -> Voiceprint:
        """创建声纹"""
        if isinstance(obj_in, dict):
            db_obj = Voiceprint(**obj_in)
        else:
            db_obj = Voiceprint(**obj_in.dict())
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self,
        db: Session,
        *,
        db_obj: Voiceprint,
        obj_in: Union[Dict[str, Any], Any]
    ) -> Voiceprint:
        """更新声纹"""
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
    
    def get_multi_by_speaker(
        self,
        db: Session,
        *,
        speaker_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Voiceprint]:
        """获取某个说话人的所有声纹"""
        return (
            db.query(Voiceprint)
            .filter(Voiceprint.speaker_id == speaker_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_all_voiceprints(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100
    ) -> List[Voiceprint]:
        """获取所有声纹"""
        return db.query(Voiceprint).offset(skip).limit(limit).all()
    
    def remove(self, db: Session, *, id: int) -> Optional[Voiceprint]:
        """删除声纹"""
        obj = db.query(Voiceprint).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

crud_voiceprint = CRUDVoiceprint()
