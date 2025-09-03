from sqlalchemy.orm import Session
from typing import Optional, Any, Dict, Union
from app.schemas.user_activity_log import UserActivityLog

class CRUDUserActivityLog:
    """封装对`user_activity_logs`表的操作"""
    
    def create(self, db: Session, *, obj_in: Union[Dict[str, Any], Any]) -> UserActivityLog:
        """插入一条新的用户活动日志"""
        if isinstance(obj_in, dict):
            db_obj = UserActivityLog(**obj_in)
        else:
            db_obj = UserActivityLog(**obj_in.dict())
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def get_user_activities(
        self,
        db: Session,
        *,
        user_id: int,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> list[UserActivityLog]:
        """获取用户活动日志"""
        query = db.query(UserActivityLog).filter(UserActivityLog.user_id == user_id)
        
        if action:
            query = query.filter(UserActivityLog.action == action)
        if resource_type:
            query = query.filter(UserActivityLog.resource_type == resource_type)
        
        return (
            query
            .order_by(UserActivityLog.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_recent_activities(
        self,
        db: Session,
        *,
        user_id: int,
        hours: int = 24,
        limit: int = 50
    ) -> list[UserActivityLog]:
        """获取用户最近的活动日志"""
        from datetime import datetime, timedelta
        
        since = datetime.utcnow() - timedelta(hours=hours)
        
        return (
            db.query(UserActivityLog)
            .filter(
                UserActivityLog.user_id == user_id,
                UserActivityLog.created_at >= since
            )
            .order_by(UserActivityLog.created_at.desc())
            .limit(limit)
            .all()
        )
    
    def get_activity_stats(
        self,
        db: Session,
        *,
        user_id: int,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, int]:
        """获取用户活动统计"""
        from datetime import datetime
        from sqlalchemy import func
        
        query = db.query(
            UserActivityLog.action,
            func.count(UserActivityLog.id).label('count')
        ).filter(UserActivityLog.user_id == user_id)
        
        if start_date:
            query = query.filter(UserActivityLog.created_at >= datetime.fromisoformat(start_date))
        if end_date:
            query = query.filter(UserActivityLog.created_at <= datetime.fromisoformat(end_date))
        
        results = query.group_by(UserActivityLog.action).all()
        
        return {action: count for action, count in results}
    
    def cleanup_old_logs(
        self,
        db: Session,
        *,
        days_to_keep: int = 90
    ) -> int:
        """清理旧的活动日志"""
        from datetime import datetime, timedelta
        
        cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
        
        deleted_count = (
            db.query(UserActivityLog)
            .filter(UserActivityLog.created_at < cutoff_date)
            .delete()
        )
        
        db.commit()
        return deleted_count

crud_user_activity_log = CRUDUserActivityLog()
