# -*- coding: utf-8 -*-
"""
Base task functionality for Celery workers.
"""

from celery import Task
from app.core.database import SessionLocal
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class BaseTask(Task):
    """Base task class with common functionality."""
    
    def on_success(self, retval, task_id, args, kwargs):
        """Called on task success."""
        logger.info(f"Task {task_id} succeeded with result: {retval}")
        
    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Called on task failure."""
        logger.error(f"Task {task_id} failed with error: {exc}")
        
    def on_retry(self, exc, task_id, args, kwargs, einfo):
        """Called on task retry."""
        logger.warning(f"Task {task_id} retrying due to: {exc}")
        
    def get_db_session(self):
        """Get database session for tasks."""
        return SessionLocal()
        
    def close_db_session(self, db):
        """Close database session."""
        if db:
            db.close()


class DatabaseTask(BaseTask):
    """Task that requires database access."""
    
    def __call__(self, *args, **kwargs):
        """Execute task with database session management."""
        db = None
        try:
            db = self.get_db_session()
            return super().__call__(*args, db=db, **kwargs)
        finally:
            self.close_db_session(db)
