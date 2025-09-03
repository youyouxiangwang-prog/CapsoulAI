# -*- coding: utf-8 -*-
"""
Storage and file management tasks.
"""

from celery import shared_task
from app.workers.tasks.base_task import DatabaseTask
from app.services.storage_service import StorageService
import logging

logger = logging.getLogger(__name__)


@shared_task(base=DatabaseTask, bind=True)
def upload_file_task(self, file_data: dict, user_id: int, db=None):
    """Upload file asynchronously."""
    try:
        storage_service = StorageService(db)
        result = storage_service.upload_file(
            file_data=file_data,
            user_id=user_id
        )
        return result
    except Exception as e:
        logger.error(f"File upload task failed: {str(e)}")
        raise


@shared_task(base=DatabaseTask, bind=True)
def delete_file_task(self, file_id: int, user_id: int, db=None):
    """Delete file asynchronously."""
    try:
        storage_service = StorageService(db)
        result = storage_service.delete_file(
            file_id=file_id,
            user_id=user_id
        )
        return result
    except Exception as e:
        logger.error(f"File deletion task failed: {str(e)}")
        raise


@shared_task(base=DatabaseTask, bind=True)
def cleanup_temp_files_task(self, db=None):
    """Clean up temporary files."""
    try:
        storage_service = StorageService(db)
        result = storage_service.cleanup_temp_files()
        return result
    except Exception as e:
        logger.error(f"Temp file cleanup task failed: {str(e)}")
        raise


@shared_task(base=DatabaseTask, bind=True)
def backup_user_data_task(self, user_id: int, db=None):
    """Backup user data asynchronously."""
    try:
        storage_service = StorageService(db)
        result = storage_service.backup_user_data(user_id)
        return result
    except Exception as e:
        logger.error(f"User data backup task failed: {str(e)}")
        raise
