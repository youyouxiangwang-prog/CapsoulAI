from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging
import traceback

from app.api.deps import get_db, get_current_tenant
from app.schemas.tenant import Tenant
from app.models.moment import MomentRead, GeneratedSummary, FilterRequest, RecommendationRequest
from app.services.moment_service import MomentService
from app.services.retrieval_service import SearchAgent, SegmentAncestryTracker
from app.models.moment import SearchResult, GeneratedSummary

router = APIRouter()

@router.get("/search", response_model=SearchResult)
def search_moments(
    query: str = Query(..., description="用户的自然语言搜索查询"),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    根据用户的自然语言查询，在多个实体（Segment, Task, Note, Schedule, Reminder）中进行搜索，
    并返回用于知识图谱可视化的节点和边。
    """
    print("search_moments called with query:", query)
    
    search_agent = SearchAgent(db=db)

    try:
        print("About to call search_agent.search", current_tenant.id)
        search_result = search_agent.search(user_query=query, tenant_id=current_tenant.id)
        print("Search result:", search_result)
        return search_result
    
    except Exception as e:
        logging.error("Error during search:", exc_info=True)
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during search: {str(e)}"
        )
    

@router.get("/summary", response_model=GeneratedSummary)
def get_summary(
    query: str = Query(..., description="用户的自然语言搜索查询"),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    根据用户的自然语言查询生成总结。
    """
    search_agent = SearchAgent(db=db)
    try:
        # We can reuse the search agent's summarization logic.
        # This assumes the summary is part of the search result object.
        summary_text = search_agent.summarize(query=query, tenant_id=current_tenant.id)
        return GeneratedSummary(summary=summary_text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during summary generation: {str(e)}"
        )

@router.get("/ancestry", response_model=Dict[str, Any])
def get_ancestry(
    segment_id: int,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    获取指定 segment 的任务链。
    """
    ancestry_tracker = SegmentAncestryTracker(db=db)
    try:
        ancestry_path = ancestry_tracker.trace_entity_ancestry(
            entity_id=segment_id,
            entity_type="Segment",
            tenant_id=current_tenant.id
        )
        return ancestry_path
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve ancestry path: {str(e)}"
        )

@router.get("/filter", response_model=List[MomentRead])
async def filter_moments(
    filter_request: FilterRequest,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """用户条件筛选想统计的任务/事件等"""
    moment_service = MomentService(db)
    moments = await moment_service.filter_moments(
        filter_criteria=filter_request,
        tenant_id=current_tenant.id
    )
    return moments

@router.get("/recommended", response_model=List[MomentRead])
async def get_recommendations(
    recommendation_request: RecommendationRequest,
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """基于用户的行为，实时推荐提醒或者温馨语录"""
    moment_service = MomentService(db)
    recommendations = await moment_service.get_recommendations(
        request=recommendation_request,
        tenant_id=current_tenant.id
    )
    return recommendations

@router.post("/summary", response_model=GeneratedSummary)
async def generate_summary_from_ids(
    moment_ids: List[int],
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """用户筛选出来的数据进行一键总结"""
    moment_service = MomentService(db)
    
    try:
        summary = await moment_service.generate_summary(
            moment_ids=moment_ids,
            tenant_id=current_tenant.id
        )
        return summary
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard_data(
    timeframe: str = Query("today", description="Time range: today, week, month, year"),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Get dashboard data including time overview, AI recap, key points and quotes
    """
    try:
        moment_service = MomentService(db)
        dashboard_data = await moment_service.get_dashboard_data(
            timeframe=timeframe,
            tenant_id=current_tenant.id
        )
        return dashboard_data
    except Exception as e:
        logging.error("Error getting dashboard data:", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard data: {str(e)}"
        )
