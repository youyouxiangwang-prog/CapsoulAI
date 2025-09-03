from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import UploadFile
from celery import chain
from app.crud.crud_line import crud_line
from app.crud.crud_segment import crud_segment
from app.crud.crud_audio import crud_audio
from app.crud.crud_conversation import crud_conversation
from app.models.conversation import ConversationRead, ConversationDetails
from app.models.line import LineRead
from app.models.search_history import SearchHistoryRead
from app.services.storage_service import StorageService
from app.services.transcription_service import TranscriptionService
from app.workers.tasks import transcription_tasks, analysis_tasks, graph_tasks
from app.utils.tools import format_duration, format_datetime
from datetime import datetime, timezone


class ConversationService:
    """实现对话创建、查询、搜索等核心业务逻辑"""
    
    def __init__(self, db: Session):
        self.db = db
        self.storage_service = StorageService()
        self.transcription_service = TranscriptionService()
    
    async def create_conversation(
        self,
        file: UploadFile,
        id: str = None,
        name: str = None,
        location: Optional[str] = None,
        participants: str = None,
        started_at: str = None,
        duration: int = None,
        title: Optional[str] = None,
        description: Optional[str] = None,
        tenant_id: str = None
    ) -> dict:
        """
        保存音频文件，写入 audios 表，并异步触发分析任务。
        支持表单参数和原有参数，兼容录音上传和业务创建。
        """
        # 保存文件
        audio_info = await self.storage_service.save_file(file, tenant_id)
        # 解析参与人
        import json
        try:
            parts = json.loads(participants) if participants else []
        except Exception:
            parts = []
        # 解析时间
        from datetime import datetime, timedelta, timezone
        try:
            started_at_dt = datetime.fromisoformat(started_at.replace("Z", "+00:00")) if started_at else None
        except Exception:
            started_at_dt = None
        if started_at_dt is None:
            started_at_dt = datetime.now(timezone.utc) - timedelta(milliseconds=duration or 0)
        ended_at_dt = started_at_dt + timedelta(milliseconds=duration or 0)
        # 写入audios表
        audio_obj = {
            "tenant_id": str(tenant_id),
            "started_at": started_at_dt,
            "ended_at": ended_at_dt,
            "source_path": audio_info["path"],
            "analysis_status": "pending",
            "status": "completed",
            "transcription_status": "pending",
            "name": name,
            "location": location,
            "participants": parts
        }
        audio = crud_audio.create(db=self.db, obj_in=audio_obj)
        # 写入conversations表，目前conversation-audio是一对一的关系
        conversation_obj = {
            "tenant_id": str(tenant_id),
            "audio_id": audio.id,
            "created_at": datetime.now(timezone.utc),
            "started_at": started_at_dt,
            "ended_at": ended_at_dt
        }
        conversation = crud_conversation.create(db=self.db, obj_in=conversation_obj)
        print("Audio created:", audio.id)
        # 异步触发音频分析和智能分析任务（串联，分析需等音频处理完）
        # 只传递 audio.id，worker 端任务内部自行创建 session
        chain(
            transcription_tasks.process_audio.s(audio.id),
            analysis_tasks.process_segments_analysis.si(audio.id),
            analysis_tasks.process_conversation_analysis.si(audio.id),
            graph_tasks.process_graph.si(str(tenant_id))
        ).apply_async()
        return {
            "ok": True,
            "user_id": str(tenant_id),
            "audio_id": str(audio.id),
            "received": {
                "id": id,
                "name": name,
                "location": location,
                "participants": parts,
                "started_at": started_at,
                "duration": duration,
                "title": title,
                "description": description,
            },
            "file": {
                "path": audio_info["path"],
                "content_type": audio_info["content_type"],
                "size": audio_info["size"],
            },
        }
    
    async def get_tenant_conversations(self, tenant_id: int) -> List[dict]:
        """获取租户的所有对话，返回对话卡所需信息"""
        conversations = crud_conversation.get_multi_by_tenant(
            db=self.db, tenant_id=tenant_id
        )
        conversations.sort(
            key=lambda c: getattr(c, "started_at") or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True
        )
        results = list()
        for conversation_info in conversations:
            audio_id = conversation_info.audio_id
            audio_info = crud_audio.get(db=self.db, id=audio_id)
            started_at = getattr(conversation_info, 'started_at')
            ended_at = getattr(conversation_info, 'ended_at')
            duration_seconds = int((ended_at - started_at).total_seconds()) if started_at and ended_at else 0
            results.append({
                'id': getattr(conversation_info, 'id'),
                'name': getattr(audio_info, 'name') if getattr(audio_info, 'name') else getattr(conversation_info, 'title'),
                'date': started_at,
                'duration': duration_seconds,
                'location': getattr(audio_info, 'location'),
                'participants': getattr(audio_info, 'participants'),
                'hashtags': getattr(conversation_info, 'hashtags'),
            })
        return results
    
    async def get_conversation_details(
        self, conversation_id: int, tenant_id: int
    ) -> List[dict]:
        """
        聚合对话、文本和分析结果，返回每个分段的详细信息，包括文本行和事项等。
        """
        from app.crud.crud_note import crud_note
        from app.crud.crud_reminder import crud_reminder
        from app.crud.crud_schedule import crud_schedule
        from app.crud.crud_task import crud_task
        conversation = crud_conversation.get(db=self.db, id=conversation_id)
        if not conversation or conversation.tenant_id != tenant_id:
            raise ValueError("Conversation not found")
        audio_start_time = getattr(conversation, 'started_at')

        # get conversation details
        details = []
        segments = crud_segment.get_multi_by_conversation(
            db=self.db, conversation_id=conversation_id
        )
        for seg in segments:
            detail = dict()
            # basic detail
            detail['id'] = getattr(seg, 'id')
            detail['level'] = 0 #TODO
            detail['title'] = getattr(seg, 'title')
            detail['summary'] = getattr(seg, 'summary')
            detail['hashtags'] = getattr(seg, 'hashtags', [])
            detail['category'] = getattr(seg, 'subcategory')
            # time
            segment_start_time = getattr(seg, 'started_at')
            segment_end_time = getattr(seg, "ended_at")
            detail["startTime"] = format_duration(segment_start_time, audio_start_time)
            detail["endTime"] = format_duration(segment_end_time, audio_start_time)
            # sentences
            lines = crud_line.get_multi_by_segment(
                db=self.db, segment_id=detail['id']
            )
            sentences = [
                {
                    "id": getattr(line, 'id'),
                    "speaker": getattr(line, 'speaker_id_in_audio', None),
                    "time": format_duration(line.started_at, audio_start_time),
                    "text": getattr(line, 'text', '')
                }
                for line in lines
            ]
            detail['sentences'] = sentences

            # attentionItems
            attentionItems = dict()
            # notes
            notes = crud_note.get_multi_by_segment_id(
                db=self.db, tenant_id=tenant_id, segment_id=detail['id']
            )
            attentionItems['notes'] = [
                {
                    "id": getattr(note, 'id'),
                    "content": getattr(note, 'content', ''),
                    "sourceId": getattr(note, 'line_ids')[0] if getattr(note, 'line_ids') else None,
                    "icon": "StickyNote"
                }
                for note in notes
            ]
            # reminders
            reminders = crud_reminder.get_multi_by_segment_id(
                db=self.db, tenant_id=tenant_id, segment_id=detail['id']
            )
            attentionItems['reminders'] = [
                {
                    "id": getattr(reminder, 'id'),
                    "content": getattr(reminder, 'content', ''),
                    "expire_time": format_datetime(getattr(reminder, 'ended_at')),
                    "sourceId": getattr(reminder, 'line_ids')[0] if getattr(reminder, 'line_ids') else None,
                    "icon": "Bell"
                }
                for reminder in reminders
            ]
            # schedules
            schedules = crud_schedule.get_multi_by_segment_id(
                db=self.db, tenant_id=tenant_id, segment_id=detail['id']
            )
            attentionItems['schedules'] = [
                {
                    "id": getattr(schedule, 'id'),
                    "topic": getattr(schedule, 'content', ''),
                    "time": format_datetime(getattr(schedule, 'started_at')),
                    "participants": getattr(schedule, 'related_people').split(',') \
                        if getattr(schedule, 'related_people') else [],
                    "sourceId": getattr(schedule, 'line_ids')[0] if getattr(schedule, 'line_ids') else None,
                    "icon": "CalendarDays"
                }
                for schedule in schedules
            ]
            # todos
            todos = crud_task.get_multi_by_segment_id(
                db=self.db, tenant_id=tenant_id, segment_id=detail['id']
            )
            attentionItems['todos'] = [
                {
                    "id": getattr(todo, 'id'),
                    "content": getattr(todo, 'content', ''),
                    "due": format_datetime(getattr(todo, 'ended_at')),
                    "sourceId": getattr(todo, 'line_ids')[0] if getattr(todo, 'line_ids') else None,
                    "icon": "CheckSquare"
                }
                for todo in todos
            ]
            detail['attentionItems'] = attentionItems

            #TODO: entities
            detail['entities'] = {
                "people": [],
                "locations": [],
            }

            details.append(detail)
        return details
    async def get_basic_summary(
        self, conversation_id: int, tenant_id: int
    ) -> List[dict]:
        """
        提取conversation的summary
        """
        conversation = crud_conversation.get(db=self.db, id=conversation_id)
        if not conversation or conversation.tenant_id != tenant_id:
            raise ValueError("Conversation not found")
        return conversation.summary
    async def get_conversation_lines(
        self,
        conversation_id: int,
        tenant_id: int,
        start_time: Optional[float] = None,
        end_time: Optional[float] = None
    ) -> List[LineRead]:
        """按时间戳查询语音片段/文本行"""
        conversation = crud_conversation.get(db=self.db, id=conversation_id)
        
        if not conversation or conversation.tenant_id != tenant_id:
            raise ValueError("Conversation not found")
        
        # TODO: 实现按时间范围查询lines
        return []
    
    async def search_conversations(
        self, query: str, tenant_id: int
    ) -> List[ConversationRead]:
        """执行基础搜索逻辑"""
        # TODO: 实现搜索逻辑
        conversations = crud_conversation.get_multi_by_tenant(
            db=self.db, tenant_id=tenant_id
        )
        
        # 简单的标题搜索
        filtered = [
            conv for conv in conversations
            if query.lower() in conv.title.lower()
        ]
        
        return filtered
    
    async def deep_search_conversations(
        self, term: str, tenant_id: int
    ) -> List[ConversationRead]:
        """执行深度搜索逻辑并检查权限"""
        # TODO: 实现深度搜索逻辑
        return []
    
    async def get_search_history(self, tenant_id: int) -> List[SearchHistoryRead]:
        """获取搜索历史"""
        # TODO: 实现搜索历史查询
        return []
