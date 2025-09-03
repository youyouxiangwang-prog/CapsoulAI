from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict, Union
from app.schemas.conversation import Conversation

class CRUDConversation:
    """封装对`conversations`表的操作"""
    
    def get(self, db: Session, id: int) -> Optional[Conversation]:
        """按ID查询"""
        return db.query(Conversation).filter(Conversation.id == id).first()
    
    def get_by_audio_id(self, db: Session, audio_id: int) -> Optional[Conversation]:
        """按音频文件ID查询"""
        return db.query(Conversation).filter(Conversation.audio_id == audio_id).first()
    
    def get_multi_by_tenant(self, db: Session, *, tenant_id: int, skip: int = 0, limit: int = 100) -> List[Conversation]:
        """按用户ID查询 - 特有"""
        return (
            db.query(Conversation)
            .filter(Conversation.tenant_id == tenant_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def create(self, db: Session, *, obj_in: Union[Dict[str, Any], Any]) -> Conversation:
        """创建对话"""
        if isinstance(obj_in, dict):
            db_obj = Conversation(**obj_in)
        else:
            db_obj = Conversation(**obj_in.dict())
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def update(
        self,
        db: Session,
        *,
        db_obj: Conversation,
        obj_in: Union[Dict[str, Any], Any]
    ) -> Conversation:
        """更新对话"""
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
    
    def remove(self, db: Session, *, id: int) -> Optional[Conversation]:
        """删除对话"""
        obj = db.query(Conversation).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj
    
    def get_by_status(
        self,
        db: Session,
        *,
        owner_id: int,
        transcription_status: Optional[str] = None,
        analysis_status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Conversation]:
        """按状态查询对话"""
        query = db.query(Conversation).filter(Conversation.owner_id == owner_id)
        
        if transcription_status:
            query = query.filter(Conversation.transcription_status == transcription_status)
        if analysis_status:
            query = query.filter(Conversation.analysis_status == analysis_status)
        
        return query.offset(skip).limit(limit).all()

    def search_by_keywords(
        self,
        db: Session,
        *,
        tenant_id: int,
        keywords: Optional[str] = None,
        time_range: Optional[Dict[str, str]] = None, 
        skip: int = 0,
        limit: int = 100
    ) -> List[Conversation]:
        """按关键词搜索对话"""
        query = db.query(Conversation).filter(Conversation.tenant_id == tenant_id)

        if keywords:
            search_term = f"%{keywords}%"
            query = query.filter(
                Conversation.title.ilike(search_term),
                Conversation.topics.ilike(search_term),
                Conversation.summary.ilike(search_term))

        return query.offset(skip).limit(limit).all()

crud_conversation = CRUDConversation()
