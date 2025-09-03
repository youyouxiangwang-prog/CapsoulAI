from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "capsoulai",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.workers.tasks.transcription_tasks",
        "app.workers.tasks.analysis_tasks"
    ]
)

# Celery配置
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
