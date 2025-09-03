# -*- coding: utf-8 -*-
"""
Celery tasks module for CapsoulAI application.
"""

from .base_task import BaseTask, DatabaseTask
from .transcription_tasks import *
from .analysis_tasks import *
from .storage_tasks import *
from .notification_tasks import *

__all__ = [
    "BaseTask",
    "DatabaseTask",
    # Transcription tasks
    "transcribe_audio_task",
    "process_transcription_task",
    "batch_transcription_task",
    # Analysis tasks  
    "analyze_conversation_task",
    "generate_summary_task",
    "extract_insights_task",
    "sentiment_analysis_task",
    # Storage tasks
    "upload_file_task",
    "delete_file_task", 
    "cleanup_temp_files_task",
    "backup_user_data_task",
    # Notification tasks
    "send_email_task",
    "send_sms_task",
    "send_push_notification_task",
    "send_batch_notifications_task"
]