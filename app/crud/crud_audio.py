from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict, Union
import uuid
from app.schemas.audio import Audio


class CRUDAudio:
    """封装对 `audios` 表的操作"""

    def get(self, db: Session, id: int) -> Optional[Audio]:
        """按主键ID查询（bigint）"""
        return db.get(Audio, id)

    def get_multi_by_tenant(
        self, 
        db: Session, 
        *, 
        tenant_id: uuid.UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Audio]:
        """按租户ID查询"""
        return (
            db.query(Audio)
            .filter(Audio.tenant_id == tenant_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def create(self, db: Session, *, obj_in: Union[Dict[str, Any], Any]) -> Audio:
        """创建音频记录"""
        data = obj_in if isinstance(obj_in, dict) else obj_in.dict(exclude_unset=True)
        # 不允许外部写入主键
        data.pop("id", None)
        db_obj = Audio(**data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: Audio,
        obj_in: Union[Dict[str, Any], Any]
    ) -> Audio:
        """更新音频记录"""
        update_data = obj_in if isinstance(obj_in, dict) else obj_in.dict(exclude_unset=True)
        # 不允许更新主键
        update_data.pop("id", None)

        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)

        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int) -> Optional[Audio]:
        """删除音频记录"""
        obj = db.get(Audio, id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj


crud_audio = CRUDAudio()
