from app.workers.celery_app import celery_app
from app.services.analysis_service import AnalysisService
from app.crud.crud_line import crud_line
from app.workers.algos.analysis_conversation import analyze_conversation_with_threshold, analyze_conversation_summary
from app.core.config import settings
from app.core.database import SessionLocal
from app.crud.crud_speaker import crud_speaker
from app.crud.crud_audio import crud_audio
from app.crud.crud_segment import crud_segment
from app.crud.crud_conversation import crud_conversation
from app.utils.tools import parse_iso_datetime
from datetime import datetime, timezone
import json

@celery_app.task
def process_segments_analysis(audio_id: int):
    """异步执行智能分析"""
    db = SessionLocal()
    try:
        # 1. 获取转录结果（查询所有 lines）
        lines = crud_line.get_multi_by_audio(db=db, audio_id=audio_id)
        conversation_id = crud_conversation.get_by_audio_id(db=db, audio_id=audio_id).id
        print(f"Processing analysis for conversation {conversation_id}, lines count: {len(lines)}")
        # 组织 lines 为 conversation 格式（列表转为 JSON 对象）
        conversation = []
        for idx, line in enumerate(lines):
            conversation.append({
                "conversation_id": conversation_id,
                "sentence_id": line.id,
                "start_time": line.started_at,
                "end_time": line.ended_at,
                "speaker_id": line.speaker_id_in_audio,
                "speaker_name": "",
                "sentence": line.text,
                "audio_file_path": "",
                "confidence": line.confidence
            })
        # 2. 调用分析服务，配置项统一从 settings 读取
        max_input_token = getattr(settings, 'ANALYSIS_MAX_INPUT_TOKEN', 12800)
        temperature = getattr(settings, 'ANALYSIS_TEMPERATURE', 0.2)
        max_tokens = getattr(settings, 'ANALYSIS_MAX_TOKENS', 4096)
        model_name = getattr(settings, 'ANALYSIS_MODEL_NAME', 'gpt-3.5-turbo')
        # conversation 作为输入
        result = analyze_conversation_with_threshold(conversation=conversation, max_input_token=max_input_token,
                                                     temperature=temperature, max_tokens=max_tokens,
                                                     model_name=model_name)
        print(f"Processing analysis for conversation {result}")
        # 3. 保存分析结果到 segments 表
        from app.crud.crud_segment import crud_segment
        from app.crud.crud_task import CRUDTask
        from app.crud.crud_schedule import CRUDSchedule
        from app.crud.crud_reminder import CRUDReminder
        from app.crud.crud_note import CRUDNote
        crud_task = CRUDTask()
        crud_schedule = CRUDSchedule()
        crud_reminder = CRUDReminder()
        crud_note = CRUDNote()
        def safe_json(val):
            if val is None or val == "null":
                return None
            if isinstance(val, (dict, list)):
                return json.dumps(val, ensure_ascii=False)
            return val
        for seg in result.get("segments", []):
            segment_data = {
                "conversation_id": conversation_id,
                "tenant_id": getattr(lines[0], "tenant_id", None) if lines else None,
                "started_at": seg.get("started_at"),
                "ended_at": seg.get("ended_at"),
                "created_at": seg.get("created_at"),
                "hashtags": seg.get("hashtags") if isinstance(seg.get("hashtags"), list) else None,
                "main_topic": safe_json(seg.get("main_topic")),
                "name_of_context": safe_json(seg.get("name_of_context")),
                "speaker_role": safe_json(seg.get("speaker_role")),
                "subcategory": safe_json(seg.get("subcategory")),
                "summary": seg.get("summary"),
                "title": seg.get("current_title"),
            }
            segment_obj = crud_segment.create(db, obj_in=segment_data)
            # 更新 line 的 segment_id 字段
            lines_obj = crud_line.get_multi_by_audio(db=db, audio_id=audio_id)
            chunk_range = seg.get("chunk_range", [])
            start_idx, end_idx = chunk_range
            for idx in range(start_idx, end_idx + 1):
                line_obj = lines_obj[idx]
                crud_line.update(db, db_obj=line_obj, obj_in={"segment_id": segment_obj.id})
            # attention_items 解析并写入
            for att in seg.get("attention_items", []):
                att_type = att.get("type")
                if att_type == "Task":
                    task_data = {
                        "tenant_id": segment_data["tenant_id"],
                        "segment_id": segment_obj.id,
                        "created_at": datetime.now(timezone.utc),
                        "started_at": parse_iso_datetime(att.get("valid_from")),
                        "ended_at": parse_iso_datetime(att.get("valid_to")),
                        "content": att.get("description"),
                        "line_ids": att.get("source_text"),
                        "priority": att.get("priority"),
                        "temporal": att.get("temporal"),
                        "related_people": att.get("related_people"),
                        "status": "to-be-confirmed"
                    }
                    crud_task.create(db, obj_in=task_data)
                elif att_type == "Schedule":
                    schedule_data = {
                        "tenant_id": segment_data["tenant_id"],
                        "segment_id": segment_obj.id,
                        "created_at": datetime.now(timezone.utc),
                        "started_at": parse_iso_datetime(att.get("valid_from")),
                        "ended_at": parse_iso_datetime(att.get("valid_to")),
                        "content": att.get("description"),
                        "line_ids": att.get("source_text"),
                        "temporal": att.get("temporal"),
                        "related_people": att.get("related_people"),
                        "status": "to-be-confirmed"
                    }
                    crud_schedule.create(db, obj_in=schedule_data)
                elif att_type == "Reminder":
                    reminder_data = {
                        "tenant_id": segment_data["tenant_id"],
                        "segment_id": segment_obj.id,
                        "created_at": datetime.now(timezone.utc),
                        "started_at": parse_iso_datetime(att.get("valid_from")),
                        "ended_at": parse_iso_datetime(att.get("valid_to")),
                        "content": att.get("description"),
                        "line_ids": att.get("source_text"),
                        "temporal": att.get("temporal"),
                        "related_people": att.get("related_people"),
                        "status": "to-be-confirmed"
                    }
                    crud_reminder.create(db, obj_in=reminder_data)
                elif att_type == "Note":
                    note_data = {
                        "tenant_id": segment_data["tenant_id"],
                        "segment_id": segment_obj.id,
                        "created_at": datetime.now(timezone.utc),
                        "started_at": parse_iso_datetime(att.get("valid_from")),
                        "ended_at": parse_iso_datetime(att.get("valid_to")),
                        "content": att.get("description"),
                        "line_ids": att.get("source_text"),
                        "temporal": att.get("temporal"),
                        "related_people": att.get("related_people"),
                        "status": "to-be-confirmed"
                    }
                    crud_note.create(db, obj_in=note_data)
        # 4. 更新状态
        # TODO: 更新 conversation 分析状态
        return {"status": "completed", "conversation_id": conversation_id, "lines": len(lines)}
    except Exception as e:
        print(f"Analysis failed for conversation {conversation_id}: {str(e)}")
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()

@celery_app.task
def process_conversation_analysis(audio_id: int):
    """异步执行conversation总结"""
    print(f"Conversation analysis started for audio {audio_id}")
    db = SessionLocal()
    try:
        # 1. 获取分析结果（）
        audio_info = crud_audio.get(db=db, id=audio_id)
        conversation_info = crud_conversation.get_by_audio_id(db=db, audio_id=audio_id)
        segments_info = crud_segment.get_multi_by_conversation(db=db, conversation_id=conversation_info.id)

        hashtags_set = set()
        summaries_list = list()
        for segment_info in segments_info:
            hashtags = getattr(segment_info, "hashtags", [])
            hashtags_set.update(hashtags)
            summaries_list.append(getattr(segment_info, "summary", ""))

        # 2. 调用分析服务，配置项统一从 settings 读取
        max_input_token = getattr(settings, 'ANALYSIS_MAX_INPUT_TOKEN', 12800)
        temperature = getattr(settings, 'ANALYSIS_TEMPERATURE', 0.2)
        max_tokens = getattr(settings, 'ANALYSIS_MAX_TOKENS', 4096)
        model_name = getattr(settings, 'ANALYSIS_MODEL_NAME', 'gpt-3.5-turbo')
        result = analyze_conversation_summary(
            segments_summaries=summaries_list, max_input_token=max_input_token,
            temperature=temperature, max_tokens=max_tokens, model_name=model_name
        )

        # 3. 更新conversation数据
        new_conversation_data = {
            "tenant_id": getattr(audio_info, "tenant_id", None),
            "audio_id": audio_id,
            "created_at": datetime.now(timezone.utc),
            "started_at": getattr(audio_info, "started_at", None),
            "ended_at": getattr(audio_info, "ended_at", None),
            "hashtags": list(hashtags_set),
            "topics": result.get('topics', []),
            "title": result.get('title', ''),
            "summary": result.get('summary', '')
        }
        conversation_info = crud_conversation.update(db, db_obj=conversation_info, obj_in=new_conversation_data)
        print(f"Conversation analysis done for audio {audio_id}")
        return {"status": "completed", "conversation_id": conversation_info.id, "audio_id": audio_id}
    except Exception as e:
        print(f"Conversation analysis failed for audio {audio_id}: {str(e)}")
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()