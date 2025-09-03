from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Union, Any, Dict
from app.api.deps import get_db, get_current_tenant
from app.schemas.tenant import Tenant
from app.services.plan_service import PlanService
from app.models.task import TaskCreate, TaskUpdate, TaskRead
from app.models.schedule import ScheduleCreate, ScheduleUpdate, ScheduleRead
from app.models.note import NoteCreate, NoteUpdate, NoteRead
from app.models.calendar import CalendarCreate, CalendarUpdate, CalendarRead

router = APIRouter()

item_type_map = {
    "task": (TaskCreate, TaskUpdate, TaskRead),
    "schedule": (ScheduleCreate, ScheduleUpdate, ScheduleRead),
    "note": (NoteCreate, NoteUpdate, NoteRead),
    "calendar": (CalendarCreate, CalendarUpdate, CalendarRead)
}

@router.get("/todos", response_model=List[Dict[str, Any]])
async def list_todos(
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """获取用户的所有建议待办事项"""
    plan_service = PlanService(db)
    todos = await plan_service.list_todos(current_tenant.id)
    return todos

@router.get("/calendar-events", response_model=List[Dict[str, Any]])
async def list_schedules(
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """获取用户的所有日程事件"""
    plan_service = PlanService(db)
    schedules = await plan_service.list_schedules(current_tenant.id)
    return schedules

@router.get("/highlights", response_model=List[Dict[str, Any]])
async def list_notes(
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """获取用户的所有笔记"""
    plan_service = PlanService(db)
    notes = await plan_service.list_notes(current_tenant.id)
    reminders = await plan_service.list_reminders(current_tenant.id)
    results = notes + reminders
    results.sort(
        key=lambda c: c.get("created_at") or datetime.min.replace(tzinfo=timezone.utc),
        reverse=True
    )
    return results

@router.post("/{item_type}", response_model=Union[TaskRead, ScheduleRead, NoteRead, CalendarRead])
async def create_item(
    item_type: str,
    item_in: Union[TaskCreate, ScheduleCreate, NoteCreate, CalendarCreate],
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """手动创建一个新规划项"""
    if item_type not in item_type_map:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid item type. Must be one of: task, schedule, note, calendar"
        )
    plan_service = PlanService(db)
    if item_type == "task":
        item = await plan_service.create_task_manually(item_in, current_tenant.id)
    elif item_type == "schedule":
        item = await plan_service.create_schedule_manually(item_in, current_tenant.id)
    elif item_type == "note":
        item = await plan_service.create_note_manually(item_in, current_tenant.id)
    elif item_type == "calendar":
        item = await plan_service.create_calendar_manually(item_in, current_tenant.id)
    return item

@router.get("/{item_type}", response_model=List[Union[TaskRead, ScheduleRead, NoteRead, CalendarRead]])
async def get_items(
    item_type: str,
    status_filter: str = Query(None, alias="status", description="状态过滤"),
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """根据状态获取规划项列表"""
    if item_type not in item_type_map:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid item type. Must be one of: task, schedule, note, calendar"
        )
    plan_service = PlanService(db)
    if item_type == "task":
        items = await plan_service.get_tasks_by_status(status_filter, current_tenant.id)
    elif item_type == "schedule":
        items = await plan_service.get_schedules_by_status(status_filter, current_tenant.id)
    elif item_type == "note":
        items = await plan_service.get_notes_by_status(status_filter, current_tenant.id)
    elif item_type == "calendar":
        items = await plan_service.get_calendars_by_status(status_filter, current_tenant.id)
    return items

@router.put("/{item_type}/{item_id}", response_model=Union[TaskRead, ScheduleRead, NoteRead, CalendarRead])
async def update_item(
    item_type: str,
    item_id: int,
    item_in: Union[TaskUpdate, ScheduleUpdate, NoteUpdate, CalendarUpdate],
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """编辑一个已存在的规划项"""
    if item_type not in item_type_map:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid item type. Must be one of: task, schedule, note, calendar"
        )
    plan_service = PlanService(db)
    try:
        if item_type == "task":
            item = await plan_service.update_task_details(item_id, item_in, current_tenant.id)
        elif item_type == "schedule":
            item = await plan_service.update_schedule_details(item_id, item_in, current_tenant.id)
        elif item_type == "note":
            item = await plan_service.update_note_details(item_id, item_in, current_tenant.id)
        elif item_type == "calendar":
            item = await plan_service.update_calendar_details(item_id, item_in, current_tenant.id)
        return item
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.put("/{item_type}/{item_id}/status", response_model=Union[TaskRead, ScheduleRead, NoteRead, CalendarRead])
async def update_item_status(
    item_type: str,
    item_id: int,
    status_in: dict,  # 这里建议定义 StatusUpdate 类型
    current_tenant: Tenant = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """更新规划项状态：确认/忽略/完成"""
    if item_type not in item_type_map:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid item type. Must be one of: task, schedule, note, calendar"
        )
    plan_service = PlanService(db)
    try:
        if item_type == "task":
            item = await plan_service.update_task_status(item_id, status_in["status"], current_tenant.id)
        elif item_type == "schedule":
            item = await plan_service.update_schedule_status(item_id, status_in["status"], current_tenant.id)
        elif item_type == "note":
            item = await plan_service.update_note_status(item_id, status_in["status"], current_tenant.id)
        elif item_type == "calendar":
            item = await plan_service.update_calendar_status(item_id, status_in["status"], current_tenant.id)
        return item
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
