from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict
from app.api.deps import get_db, get_current_tenant
from app.schemas.tenant import Tenant
from app.models.conversation import ConversationRead, ConversationDetails
from app.crud.crud_audio import crud_audio
from app.schemas.audio import Audio
from app.models.audio import AudioCreate
from app.models.line import LineRead
from app.models.search_history import SearchHistoryRead
from app.services.conversation_service import ConversationService
from app.services.plan_service import PlanService

router = APIRouter()

@router.post("/recordings")
async def upload_recording(
    # 这些名称要与前端 FormData 的 key 完全一致
    id: str = Form(...),
    name: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    participants: str = Form("[]"),    # 前端是 JSON.stringified
    started_at: str = Form(...),
    duration: int = Form(...),
    audioFile: UploadFile = File(...), # 前端用的字段名是 audioFile
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    tenant_id = getattr(current_tenant, 'id', None)
    print(f"[DEBUG] current_tenant: {tenant_id}, {getattr(current_tenant, 'email', None)}")
    conversation_service = ConversationService(db)
    result = await conversation_service.create_conversation(
        file=audioFile,
        id=id,
        name=name,
        location=location,
        participants=participants,
        started_at=started_at,
        duration=int(duration),
        tenant_id=tenant_id
    )
    return result

@router.get("/recordings", response_model=List[Dict[str, Any]])
async def get_recordings(
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """获取当前用户的所有录音列表"""
    conversation_service = ConversationService(db)
    conversations = await conversation_service.get_tenant_conversations(current_tenant.id)
    return conversations

@router.get("/recordings/{conversation_id}", response_model=List[Dict[str, Any]])
async def get_recording_details(
    conversation_id: int,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """获取单个录音的完整详情"""
    conversation_service = ConversationService(db)
    
    try:
        details = await conversation_service.get_conversation_details(
            conversation_id, current_tenant.id
        )
        return details
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recording not found: {str(e)}"
        )

@router.get("/recordings/{conversation_id}/basic_summary", response_model=str)
async def get_basic_summary(
    conversation_id: int,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """获取单个录音的基本总结"""
    conversation_service = ConversationService(db)

    try:
        basic_summary = await conversation_service.get_basic_summary(
            conversation_id, current_tenant.id
        )
        return basic_summary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recording not found: {str(e)}"
        )

@router.get("/recordings/{conversation_id}/lines", response_model=List[LineRead])
async def get_recording_lines(
    conversation_id: int,
    start_time: Optional[float] = Query(None, description="开始时间（秒）"),
    end_time: Optional[float] = Query(None, description="结束时间（秒）"),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """按时间戳查询语音片段/文本行"""
    conversation_service = ConversationService(db)
    
    try:
        lines = await conversation_service.get_conversation_lines(
            conversation_id, current_tenant.id, start_time, end_time
        )
        return lines
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/todos/{conversation_id}", response_model=List[Dict[str, Any]])
async def get_suggested_todos(
    conversation_id: int,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """获取单个录音的建议待办事项"""
    plan_service = PlanService(db)
    suggested_todos = await plan_service.get_suggested_todos(conversation_id, current_tenant.id)
    return suggested_todos

@router.get("/calendar-events/{conversation_id}", response_model=List[Dict[str, Any]])
async def get_suggested_events(
    conversation_id: int,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """获取单个录音的建议日历事件"""
    plan_service = PlanService(db)
    suggested_events = await plan_service.get_suggested_events(conversation_id, current_tenant.id)
    return suggested_events

@router.get("/search", response_model=List[ConversationRead])
async def search_recordings(
    q: str = Query(..., description="搜索关键词"),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """基础搜索：按标题等元数据搜索"""
    conversation_service = ConversationService(db)
    results = await conversation_service.search_conversations(q, current_tenant.id)
    return results

@router.get("/deep-search", response_model=List[ConversationRead])
async def deep_search_recordings(
    q: str = Query(..., description="深度搜索关键词"),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """深度搜索：搜索转录内容，并返回因果链"""
    conversation_service = ConversationService(db)
    results = await conversation_service.deep_search_conversations(q, current_tenant)
    return results

@router.get("/search-history", response_model=List[SearchHistoryRead])
async def get_search_history(
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """获取用户最近的搜索历史"""
    conversation_service = ConversationService(db)
    history = await conversation_service.get_search_history(current_tenant.id)
    return history
