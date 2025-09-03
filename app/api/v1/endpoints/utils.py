from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import Dict, Any
from app.api.deps import get_db, get_current_tenant
from app.schemas.tenant import Tenant
from app.models.speaker import SpeakerCreate, SpeakerRead
from app.models.voiceprint import VoiceprintCreate, VoiceprintRead
from app.models.export import ExportJobStatus
from app.services.integration_service import IntegrationService, SpeakerService, ExportService

router = APIRouter()

@router.get("/integrations/{provider}/connect")
async def connect_integration(
    provider: str,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """发起第三方应用授权"""
    integration_service = IntegrationService(db)
    
    try:
        auth_url = await integration_service.initiate_oauth(
            provider=provider,
            tenant_id=current_tenant.id
        )
        return RedirectResponse(url=auth_url)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/integrations/{provider}/callback")
async def integration_callback(
    provider: str,
    request: Request,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """处理第三方应用授权回调"""
    integration_service = IntegrationService(db)
    
    try:
        result = await integration_service.handle_oauth_callback(
            provider=provider,
            request=request,
            tenant_id=current_tenant.id
        )
        return JSONResponse(content=result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/speakers", response_model=SpeakerRead)
async def create_speaker(
    speaker_in: SpeakerCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """创建一个新的说话人"""
    speaker_service = SpeakerService(db)
    speaker = await speaker_service.create_speaker(speaker_in)
    return speaker

@router.post("/speakers/{speaker_id}/voiceprint", response_model=VoiceprintRead)
async def create_voiceprint(
    speaker_id: int,
    voiceprint_in: VoiceprintCreate,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """为指定说话人录入声纹"""
    speaker_service = SpeakerService(db)
    
    try:
        voiceprint = await speaker_service.create_voiceprint(
            speaker_id=speaker_id,
            voiceprint_data=voiceprint_in
        )
        return voiceprint
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.post("/export", response_model=ExportJobStatus)
async def start_export(
    export_config: Dict[str, Any],
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """发起文件导出任务"""
    export_service = ExportService(db)
    
    try:
        job_status = await export_service.start_export_job(
            config=export_config,
            tenant_id=current_tenant.id
        )
        return job_status
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
