from app.workers.celery_app import celery_app
from app.services.transcription_service import TranscriptionService
from app.crud.crud_audio import crud_audio
from app.crud.crud_line import crud_line
from app.core.config import settings
from app.workers.algos.preprocess_audio import preprocess_audio, remap_segments_to_original_timeline
from app.core.database import SessionLocal
import os
import requests
from datetime import timedelta
from app.crud.crud_tenant import crud_tenant

@celery_app.task
def process_transcription(conversation_id: int):
    """异步执行音频转录"""
    try:
        # TODO: 实现转录逻辑
        # 1. 获取对话记录
        # 2. 调用转录服务
        # 3. 保存转录结果
        # 4. 更新状态
        # 5. 触发分析任务
        
        print(f"Processing transcription for conversation {conversation_id}")
        
        # 模拟转录处理
        transcription_service = TranscriptionService()
        # result = await transcription_service.request_transcription(source_path)
        
        # 触发分析任务
        from app.workers.tasks.analysis_tasks import process_segments_analysis
        process_segments_analysis.delay(conversation_id)
        
        return {"status": "completed", "conversation_id": conversation_id}
        
    except Exception as e:
        print(f"Transcription failed for conversation {conversation_id}: {str(e)}")
        return {"status": "failed", "error": str(e)}

@celery_app.task
def process_audio(audio_id: int):
    """异步处理音频分析主入口，供上传后调用"""
    db = SessionLocal()
    print("db.bind.url", db.bind.url)
    preproc_path = None
    try:
        # 查询 audio 记录
        audio = crud_audio.get(db, id=audio_id)
        audio_start_time = getattr(audio, 'started_at', None)
        print("Processing audio for transcription:", audio.source_path)
        if not audio:
            print(f"Audio {audio_id} not found")
            return {"status": "failed", "error": "audio not found"}
        # 获取音频文件绝对路径
        audio_path = os.path.join(settings.UPLOAD_DIR, str(audio.tenant_id), os.path.basename(audio.source_path))

        # === (1) 先做预处理 ===
        base, ext = os.path.splitext(audio_path)
        preproc_path = f"{base}_preproc{ext}"
        print(f"Preprocessing audio: {audio_path} -> {preproc_path}")
        mapping = preprocess_audio(input_path=audio_path, output_path=preproc_path)

        # === (2) 调用转录服务 ===
        print(f"Transcribing audio: {preproc_path}")
        segments, embeddings = whisperx_transcribe(preproc_path)

        # === (3) 将转录结果的时间戳映射回原始音频时间轴 ===
        segments = remap_segments_to_original_timeline(segments, mapping)

        print(f"Transcribe {len(segments)} segments for audio {audio_id}")
        # 写入 lines 表
        for seg in segments:
            started_at = None
            if audio_start_time is not None and seg.get("start") is not None:
                started_at = audio_start_time + timedelta(seconds=seg.get("start"))
            ended_at = None
            if audio_start_time is not None and seg.get("end") is not None:
                ended_at = audio_start_time + timedelta(seconds=seg.get("end"))
            # 优化 line_data 字段，支持 seg 结构
            # speaker_id_in_audio 从 words[0]['speaker'] 获取（如有）
            speaker_id_in_audio = None
            if seg.get("words") and isinstance(seg["words"], list) and seg["words"]:
                speaker_id_in_audio = seg["words"][0].get("speaker")
            confidence = None
            if seg.get("words") and isinstance(seg["words"], list) and seg["words"]:
                confidence = seg["words"][0].get("score")
            line_data = {
                "tenant_id": audio.tenant_id,
                "audio_id": audio_id,
                "speaker_id": None,  # 可为 None，目前无法知道
                "speaker_id_in_audio": speaker_id_in_audio,  # 优先用 words[0]['speaker']
                "started_at": started_at,
                "ended_at": ended_at,
                "text": seg.get("text"),
                "confidence": confidence,
            }
            # 写入数据库
            line = crud_line.create(db, obj_in=line_data)
            # print(f"Line created: {line.id} for audio {audio_id}")
        # 可选：更新 audio 状态
        db_obj = crud_audio.get(db, audio_id)
        crud_audio.update(db, db_obj=db_obj, obj_in={"transcription_status": "transcribed"})
        return {"status": "completed", "audio_id": audio_id, "lines": len(segments)}
    except Exception as e:
        print(f"Audio processing failed for {audio_id}: {str(e)}")
        return {"status": "failed", "error": str(e)}
    finally:
        # === (4) 清理临时预处理文件 ===
        try:
            keep = getattr(settings, "KEEP_PREPROCESSED_AUDIO", False)
            if (not keep) and preproc_path and os.path.exists(preproc_path):
                os.remove(preproc_path)
        except Exception as _:
            pass
        db.close()

def whisperx_transcribe(audio_path: str):
    files={"file": open(audio_path, "rb")}
    url = "http://10.183.155.10:5525/transcribe"
    response = requests.post(
        url,
        files={"file": open(audio_path, "rb")},
        data={"batch_size": 16, "diarize": "true", "return_char_alignments": "false"}
    )
    print(f"response",response)
    result = response.json()
 
    return result["segments"], result["embeddings"]