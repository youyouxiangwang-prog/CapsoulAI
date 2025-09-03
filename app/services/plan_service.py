from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.task import TaskCreate, TaskRead, TaskUpdate
from app.models.schedule import ScheduleCreate, ScheduleRead, ScheduleUpdate
from app.models.note import NoteCreate, NoteRead, NoteUpdate
from app.models.calendar import CalendarCreate, CalendarRead, CalendarUpdate
# 假设你有 calendar 相关 schema
# from app.schemas.calendar import CalendarCreate, CalendarRead, CalendarUpdate
from app.crud.crud_task import CRUDTask
from app.crud.crud_schedule import CRUDSchedule
from app.crud.crud_note import CRUDNote
from app.crud.crud_reminder import CRUDReminder
# from app.crud.crud_calendar import crud_calendar
from app.utils.tools import format_datetime

class PlanService:
    """实现规划项的核心业务逻辑"""
    
    def __init__(self, db: Session):
        self.db = db
        self.crud_task = CRUDTask()
        self.crud_schedule = CRUDSchedule()
        self.crud_note = CRUDNote()
        self.crud_reminder = CRUDReminder()
        # self.crud_calendar = CRUDCalendar() # 如有 calendar CRUD
    
    async def list_todos(self, tenant_id: int) -> List[dict]:
        """获取用户的所有建议待办事项"""
        results = list()
        tasks = self.crud_task.get_multi_by_tenant_id(db=self.db, tenant_id=tenant_id)
        tasks.sort(
            key=lambda c: getattr(c, "created_at") or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True
        )
        for task in tasks:
            results.append({
                "id": getattr(task, "id"),
                "title": getattr(task, "content"),
                # "description": getattr(task, "content"),
                "label": getattr(task, "temporal"),
                "priority": getattr(task, "priority"),
                "status": getattr(task, "status"),
                "due_date": format_datetime(getattr(task, "ended_at"), with_time=False)
            })
        return results

    async def list_schedules(self, tenant_id: int) -> List[dict]:
        """获取用户的所有日程事件"""
        results = list()
        schedules = self.crud_schedule.get_multi_by_tenant_id(db=self.db, tenant_id=tenant_id)
        schedules.sort(
            key=lambda c: getattr(c, "created_at") or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True
        )
        for schedule in schedules:
            results.append({
                "id": getattr(schedule, "id"),
                "title": getattr(schedule, "content"),
                # "description": getattr(schedule, "content"),
                "start_time": format_datetime(getattr(schedule, "started_at")),
                "end_time": format_datetime(getattr(schedule, "ended_at")),
                "status": getattr(schedule, "status"),
                "location": "" #TODO
            })
        return results

    async def list_notes(self, tenant_id: int) -> List[dict]:
        """获取用户的所有笔记"""
        results = list()
        notes = self.crud_note.get_multi_by_tenant_id(db=self.db, tenant_id=tenant_id)
        notes.sort(
            key=lambda c: getattr(c, "created_at") or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True
        )
        for note in notes:
            results.append({
                "id": getattr(note, "id"),
                "title": "Note",
                "content": getattr(note, "content"),
                "category": "note",
                "created_date": format_datetime(getattr(note, "created_at"), with_time=False),
                "source_recording_id": None #TODO
            })
        return results

    async def list_reminders(self, tenant_id: int) -> List[dict]:
        """获取用户的所有提醒事项"""
        results = list()
        reminders = self.crud_reminder.get_multi_by_tenant_id(db=self.db, tenant_id=tenant_id)
        reminders.sort(
            key=lambda c: getattr(c, "created_at") or datetime.min.replace(tzinfo=timezone.utc),
            reverse=True
        )
        for reminder in reminders:
            results.append({
                "id": getattr(reminder, "id"),
                "title": "Reminder",
                "content": getattr(reminder, "content"),
                "category": "reminder",
                "created_date": format_datetime(getattr(reminder, "created_at"), with_time=False),
                "source_recording_id": None #TODO
            })
        return results

    async def get_suggested_todos(
        self, conversation_id: int, tenant_id: int
    ) -> List[dict]:
        """获取单个录音的建议待办事项"""
        results = list()
        from app.crud.crud_segment import crud_segment
        segments = crud_segment.get_multi_by_conversation(
            db=self.db, conversation_id=conversation_id)
        for seg in segments:
            segment_id = getattr(seg, "id")
            tasks = self.crud_task.get_multi_by_segment_id(db=self.db, segment_id=segment_id, tenant_id=tenant_id)
            for task in tasks:
                results.append({
                    "id": getattr(task, "id"),
                    "title": getattr(task, "content"),
                    # "description": getattr(task, "content"),
                    "label": getattr(task, "temporal"),
                    "priority": getattr(task, "priority"),
                    "status": getattr(task, "status"),
                    "due_date": format_datetime(getattr(task, "ended_at"), with_time=False)
                })
        return results

    async def get_suggested_events(
        self, conversation_id: int, tenant_id: int
    ) -> List[dict]:
        """获取单个录音的建议日历事件"""
        results = list()
        from app.crud.crud_segment import crud_segment
        segments = crud_segment.get_multi_by_conversation(
            db=self.db, conversation_id=conversation_id)
        for seg in segments:
            segment_id = getattr(seg, "id")
            schedules = self.crud_schedule.get_multi_by_segment_id(db=self.db, segment_id=segment_id, tenant_id=tenant_id)
            for schedule in schedules:
                results.append({
                    "id": getattr(schedule, "id"),
                    "title": getattr(schedule, "content"),
                    # "description": getattr(schedule, "content"),
                    "start_time": format_datetime(getattr(schedule, "started_at")),
                    "end_time": format_datetime(getattr(schedule, "ended_at")),
                    "status": getattr(schedule, "status"),
                    "location": "" #TODO
                })
            #TODO: reminder要不要加到events
        return results

    async def create_task_manually(
        self,
        task_data: TaskCreate,
        owner_id: int
    ) -> TaskRead:
        """处理手动创建任务的逻辑"""
        # 准备创建数据
        create_data = task_data.dict()
        create_data.update({
            "type": "task",
            "owner_id": owner_id,
            "status": "pending"
        })
        
        # 创建任务
        task = self.crud_task.create(db=self.db, obj_in=create_data)
        
        # 记录用户活动
        await self._log_activity(
            user_id=owner_id,
            action="create_task",
            resource_type="task",
            resource_id=task.id
        )
        
        return TaskRead.from_orm(task)
    
    async def create_schedule_manually(
        self,
        schedule_data: ScheduleCreate,
        owner_id: int
    ) -> ScheduleRead:
        """处理手动创建日程的逻辑"""
        # 准备创建数据
        create_data = schedule_data.dict()
        create_data.update({
            "type": "schedule",
            "owner_id": owner_id,
            "status": "pending"
        })
        
        # 创建日程
        schedule = self.crud_schedule.create(db=self.db, obj_in=create_data)
        
        # 记录用户活动
        await self._log_activity(
            user_id=owner_id,
            action="create_schedule",
            resource_type="schedule",
            resource_id=schedule.id
        )
        
        return ScheduleRead.from_orm(schedule)
    
    async def create_note_manually(
        self,
        note_data: NoteCreate,
        owner_id: int
    ) -> NoteRead:
        """处理手动创建笔记的逻辑"""
        # 准备创建数据
        create_data = note_data.dict()
        create_data.update({
            "type": "note",
            "owner_id": owner_id,
            "status": "pending"
        })
        
        # 创建笔记
        note = self.crud_note.create(db=self.db, obj_in=create_data)
        
        # 记录用户活动
        await self._log_activity(
            user_id=owner_id,
            action="create_note",
            resource_type="note",
            resource_id=note.id
        )
        
        return NoteRead.from_orm(note)
    
    async def get_tasks_by_status(
        self,
        status: Optional[str],
        owner_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[TaskRead]:
        """获取指定状态的任务列表"""
        tasks = self.crud_task.get_by_owner_and_status(
            db=self.db,
            owner_id=owner_id,
            status=status,
            skip=skip,
            limit=limit
        )
        
        return [TaskRead.from_orm(task) for task in tasks]
    
    async def get_schedules_by_status(
        self,
        status: Optional[str],
        owner_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[ScheduleRead]:
        """获取指定状态的日程列表"""
        schedules = self.crud_schedule.get_by_owner_and_status(
            db=self.db,
            owner_id=owner_id,
            status=status,
            skip=skip,
            limit=limit
        )
        
        return [ScheduleRead.from_orm(schedule) for schedule in schedules]
    
    async def get_notes_by_status(
        self,
        status: Optional[str],
        owner_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[NoteRead]:
        """获取指定状态的笔记列表"""
        notes = self.crud_note.get_by_owner_and_status(
            db=self.db,
            owner_id=owner_id,
            status=status,
            skip=skip,
            limit=limit
        )
        
        return [NoteRead.from_orm(note) for note in notes]
    
    async def get_calendars_by_status(
        self,
        status: Optional[str],
        owner_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[CalendarRead]:
        """获取指定状态的日历列表"""
        calendars = crud_calendar.get_by_owner_and_status(
            db=self.db,
            owner_id=owner_id,
            status=status,
            skip=skip,
            limit=limit
        )
        
        return [CalendarRead.from_orm(calendar) for calendar in calendars]
    
    async def update_task_details(
        self,
        task_id: int,
        task_data: TaskUpdate,
        owner_id: int
    ) -> TaskRead:
        """处理编辑任务的逻辑"""
        # 获取现有任务
        existing_task = self.crud_task.get(db=self.db, id=task_id)
        if not existing_task:
            raise ValueError("Task not found")
        
        # 检查权限
        if existing_task.owner_id != owner_id:
            raise ValueError("Permission denied")
        
        # 更新任务
        updated_task = self.crud_task.update(
            db=self.db,
            db_obj=existing_task,
            obj_in=task_data
        )
        
        # 记录用户活动
        await self._log_activity(
            user_id=owner_id,
            action="update_task",
            resource_type="task",
            resource_id=task_id
        )
        
        return TaskRead.from_orm(updated_task)
    
    async def update_schedule_details(
        self,
        schedule_id: int,
        schedule_data: ScheduleUpdate,
        owner_id: int
    ) -> ScheduleRead:
        """处理编辑日程的逻辑"""
        # 获取现有日程
        existing_schedule = self.crud_schedule.get(db=self.db, id=schedule_id)
        if not existing_schedule:
            raise ValueError("Schedule not found")
        
        # 检查权限
        if existing_schedule.owner_id != owner_id:
            raise ValueError("Permission denied")
        
        # 更新日程
        updated_schedule = self.crud_schedule.update(
            db=self.db,
            db_obj=existing_schedule,
            obj_in=schedule_data
        )
        
        # 记录用户活动
        await self._log_activity(
            user_id=owner_id,
            action="update_schedule",
            resource_type="schedule",
            resource_id=schedule_id
        )
        
        return ScheduleRead.from_orm(updated_schedule)
    
    async def update_note_details(
        self,
        note_id: int,
        note_data: NoteUpdate,
        owner_id: int
    ) -> NoteRead:
        """处理编辑笔记的逻辑"""
        # 获取现有笔记
        existing_note = self.crud_note.get(db=self.db, id=note_id)
        if not existing_note:
            raise ValueError("Note not found")
        
        # 检查权限
        if existing_note.owner_id != owner_id:
            raise ValueError("Permission denied")
        
        # 更新笔记
        updated_note = self.crud_note.update(
            db=self.db,
            db_obj=existing_note,
            obj_in=note_data
        )
        
        # 记录用户活动
        await self._log_activity(
            user_id=owner_id,
            action="update_note",
            resource_type="note",
            resource_id=note_id
        )
        
        return NoteRead.from_orm(updated_note)
    
    async def update_calendar_details(
        self,
        calendar_id: int,
        calendar_data: CalendarUpdate,
        owner_id: int
    ) -> CalendarRead:
        """处理编辑日历的逻辑"""
        # 获取现有日历
        existing_calendar = crud_calendar.get(db=self.db, id=calendar_id)
        if not existing_calendar:
            raise ValueError("Calendar not found")
        
        # 检查权限
        if existing_calendar.owner_id != owner_id:
            raise ValueError("Permission denied")
        
        # 更新日历
        updated_calendar = crud_calendar.update(
            db=self.db,
            db_obj=existing_calendar,
            obj_in=calendar_data
        )
        
        # 记录用户活动
        await self._log_activity(
            user_id=owner_id,
            action="update_calendar",
            resource_type="calendar",
            resource_id=calendar_id
        )
        
        return CalendarRead.from_orm(updated_calendar)
    
    async def update_task_status(
        self,
        task_id: int,
        new_status: str,
        owner_id: int
    ) -> TaskRead:
        """处理任务状态流转的逻辑"""
        # 验证状态
        if new_status not in ["pending", "completed", "ignored"]:
            raise ValueError("Invalid status. Must be one of: pending, completed, ignored")
        
        # 获取现有任务
        existing_task = self.crud_task.get(db=self.db, id=task_id)
        if not existing_task:
            raise ValueError("Task not found")
        
        # 检查权限
        if existing_task.owner_id != owner_id:
            raise ValueError("Permission denied")
        
        # 更新状态
        updated_task = self.crud_task.update(
            db=self.db,
            db_obj=existing_task,
            obj_in={"status": new_status}
        )
        
        # 记录用户活动
        await self._log_activity(
            user_id=owner_id,
            action="update_task_status",
            resource_type="task",
            resource_id=task_id,
            metadata={"old_status": existing_task.status, "new_status": new_status}
        )
        
        return TaskRead.from_orm(updated_task)
    
    async def update_schedule_status(
        self,
        schedule_id: int,
        new_status: str,
        owner_id: int
    ) -> ScheduleRead:
        """处理日程状态流转的逻辑"""
        # 验证状态
        if new_status not in ["pending", "completed", "ignored"]:
            raise ValueError("Invalid status. Must be one of: pending, completed, ignored")
        
        # 获取现有日程
        existing_schedule = self.crud_schedule.get(db=self.db, id=schedule_id)
        if not existing_schedule:
            raise ValueError("Schedule not found")
        
        # 检查权限
        if existing_schedule.owner_id != owner_id:
            raise ValueError("Permission denied")
        
        # 更新状态
        updated_schedule = self.crud_schedule.update(
            db=self.db,
            db_obj=existing_schedule,
            obj_in={"status": new_status}
        )
        
        # 记录用户活动
        await self._log_activity(
            user_id=owner_id,
            action="update_schedule_status",
            resource_type="schedule",
            resource_id=schedule_id,
            metadata={"old_status": existing_schedule.status, "new_status": new_status}
        )
        
        return ScheduleRead.from_orm(updated_schedule)
    
    async def update_note_status(
        self,
        note_id: int,
        new_status: str,
        owner_id: int
    ) -> NoteRead:
        """处理笔记状态流转的逻辑"""
        # 验证状态
        if new_status not in ["pending", "completed", "ignored"]:
            raise ValueError("Invalid status. Must be one of: pending, completed, ignored")
        
        # 获取现有笔记
        existing_note = self.crud_note.get(db=self.db, id=note_id)
        if not existing_note:
            raise ValueError("Note not found")
        
        # 检查权限
        if existing_note.owner_id != owner_id:
            raise ValueError("Permission denied")
        
        # 更新状态
        updated_note = self.crud_note.update(
            db=self.db,
            db_obj=existing_note,
            obj_in={"status": new_status}
        )
        
        # 记录用户活动
        await self._log_activity(
            user_id=owner_id,
            action="update_note_status",
            resource_type="note",
            resource_id=note_id,
            metadata={"old_status": existing_note.status, "new_status": new_status}
        )
        
        return NoteRead.from_orm(updated_note)
    
    async def update_calendar_status(
        self,
        calendar_id: int,
        new_status: str,
        owner_id: int
    ) -> CalendarRead:
        """处理日历状态流转的逻辑"""
        # 验证状态
        if new_status not in ["pending", "completed", "ignored"]:
            raise ValueError("Invalid status. Must be one of: pending, completed, ignored")
        
        # 获取现有日历
        existing_calendar = crud_calendar.get(db=self.db, id=calendar_id)
        if not existing_calendar:
            raise ValueError("Calendar not found")
        
        # 检查权限
        if existing_calendar.owner_id != owner_id:
            raise ValueError("Permission denied")
        
        # 更新状态
        updated_calendar = crud_calendar.update(
            db=self.db,
            db_obj=existing_calendar,
            obj_in={"status": new_status}
        )
        
        # 记录用户活动
        await self._log_activity(
            user_id=owner_id,
            action="update_calendar_status",
            resource_type="calendar",
            resource_id=calendar_id,
            metadata={"old_status": existing_calendar.status, "new_status": new_status}
        )
        
        return CalendarRead.from_orm(updated_calendar)
    
    async def get_pending_tasks(
        self,
        owner_id: int
    ) -> List[TaskRead]:
        """获取待处理的任务"""
        tasks = self.crud_task.get_pending_items(
            db=self.db,
            owner_id=owner_id
        )
        
        return [TaskRead.from_orm(task) for task in tasks]
    
    async def get_pending_schedules(
        self,
        owner_id: int
    ) -> List[ScheduleRead]:
        """获取待处理的日程"""
        schedules = self.crud_schedule.get_pending_items(
            db=self.db,
            owner_id=owner_id
        )
        
        return [ScheduleRead.from_orm(schedule) for schedule in schedules]
    
    async def get_pending_notes(
        self,
        owner_id: int
    ) -> List[NoteRead]:
        """获取待处理的笔记"""
        notes = self.crud_note.get_pending_items(
            db=self.db,
            owner_id=owner_id
        )
        
        return [NoteRead.from_orm(note) for note in notes]
    
    async def get_pending_calendars(
        self,
        owner_id: int
    ) -> List[CalendarRead]:
        """获取待处理的日历"""
        calendars = crud_calendar.get_pending_items(
            db=self.db,
            owner_id=owner_id
        )
        
        return [CalendarRead.from_orm(calendar) for calendar in calendars]
    
    async def get_overdue_tasks(
        self,
        owner_id: int
    ) -> List[TaskRead]:
        """获取逾期的任务"""
        tasks = self.crud_task.get_overdue_items(
            db=self.db,
            owner_id=owner_id
        )
        
        return [TaskRead.from_orm(task) for task in tasks]
    
    async def get_overdue_schedules(
        self,
        owner_id: int
    ) -> List[ScheduleRead]:
        """获取逾期的日程"""
        schedules = self.crud_schedule.get_overdue_items(
            db=self.db,
            owner_id=owner_id
        )
        
        return [ScheduleRead.from_orm(schedule) for schedule in schedules]
    
    async def get_overdue_notes(
        self,
        owner_id: int
    ) -> List[NoteRead]:
        """获取逾期的笔记"""
        notes = self.crud_note.get_overdue_items(
            db=self.db,
            owner_id=owner_id
        )
        
        return [NoteRead.from_orm(note) for note in notes]
    
    async def get_overdue_calendars(
        self,
        owner_id: int
    ) -> List[CalendarRead]:
        """获取逾期的日历"""
        calendars = crud_calendar.get_overdue_items(
            db=self.db,
            owner_id=owner_id
        )
        
        return [CalendarRead.from_orm(calendar) for calendar in calendars]
    
    async def delete_task(
        self,
        task_id: int,
        owner_id: int
    ) -> bool:
        """删除任务"""
        # 获取现有任务
        existing_task = self.crud_task.get(db=self.db, id=task_id)
        if not existing_task:
            raise ValueError("Task not found")
        
        # 检查权限
        if existing_task.owner_id != owner_id:
            raise ValueError("Permission denied")
        
        # 删除任务
        self.crud_task.remove(db=self.db, id=task_id)
        
        # 记录用户活动
        await self._log_activity(
            user_id=owner_id,
            action="delete_task",
            resource_type="task",
            resource_id=task_id
        )
        
        return True
    
    async def delete_schedule(
        self,
        schedule_id: int,
        owner_id: int
    ) -> bool:
        """删除日程"""
        # 获取现有日程
        existing_schedule = self.crud_schedule.get(db=self.db, id=schedule_id)
        if not existing_schedule:
            raise ValueError("Schedule not found")
        
        # 检查权限
        if existing_schedule.owner_id != owner_id:
            raise ValueError("Permission denied")
        
        # 删除日程
        self.crud_schedule.remove(db=self.db, id=schedule_id)
        
        # 记录用户活动
        await self._log_activity(
            user_id=owner_id,
            action="delete_schedule",
            resource_type="schedule",
            resource_id=schedule_id
        )
        
        return True
    
    async def delete_note(
        self,
        note_id: int,
        owner_id: int
    ) -> bool:
        """删除笔记"""
        # 获取现有笔记
        existing_note = self.crud_note.get(db=self.db, id=note_id)
        if not existing_note:
            raise ValueError("Note not found")
        
        # 检查权限
        if existing_note.owner_id != owner_id:
            raise ValueError("Permission denied")
        
        # 删除笔记
        self.crud_note.remove(db=self.db, id=note_id)
        
        # 记录用户活动
        await self._log_activity(
            user_id=owner_id,
            action="delete_note",
            resource_type="note",
            resource_id=note_id
        )
        
        return True
    
    async def delete_calendar(
        self,
        calendar_id: int,
        owner_id: int
    ) -> bool:
        """删除日历"""
        # 获取现有日历
        existing_calendar = crud_calendar.get(db=self.db, id=calendar_id)
        if not existing_calendar:
            raise ValueError("Calendar not found")
        
        # 检查权限
        if existing_calendar.owner_id != owner_id:
            raise ValueError("Permission denied")
        
        # 删除日历
        crud_calendar.remove(db=self.db, id=calendar_id)
        
        # 记录用户活动
        await self._log_activity(
            user_id=owner_id,
            action="delete_calendar",
            resource_type="calendar",
            resource_id=calendar_id
        )
        
        return True
    
    async def get_task_statistics(
        self,
        owner_id: int
    ) -> dict:
        """获取任务统计信息"""
        # 获取各状态的数量
        pending_tasks = await self.get_tasks_by_status(
            status="pending",
            owner_id=owner_id
        )
        
        completed_tasks = await self.get_tasks_by_status(
            status="completed",
            owner_id=owner_id
        )
        
        overdue_tasks = await self.get_overdue_tasks(
            owner_id=owner_id
        )
        
        return {
            "total_pending": len(pending_tasks),
            "total_completed": len(completed_tasks),
            "total_overdue": len(overdue_tasks),
            "completion_rate": len(completed_tasks) / (len(pending_tasks) + len(completed_tasks)) * 100 if (len(pending_tasks) + len(completed_tasks)) > 0 else 0
        }
    
    async def get_schedule_statistics(
        self,
        owner_id: int
    ) -> dict:
        """获取日程统计信息"""
        # 获取各状态的数量
        pending_schedules = await self.get_schedules_by_status(
            status="pending",
            owner_id=owner_id
        )
        
        completed_schedules = await self.get_schedules_by_status(
            status="completed",
            owner_id=owner_id
        )
        
        overdue_schedules = await self.get_overdue_schedules(
            owner_id=owner_id
        )
        
        return {
            "total_pending": len(pending_schedules),
            "total_completed": len(completed_schedules),
            "total_overdue": len(overdue_schedules),
            "completion_rate": len(completed_schedules) / (len(pending_schedules) + len(completed_schedules)) * 100 if (len(pending_schedules) + len(completed_schedules)) > 0 else 0
        }
    
    async def get_note_statistics(
        self,
        owner_id: int
    ) -> dict:
        """获取笔记统计信息"""
        # 获取各状态的数量
        pending_notes = await self.get_notes_by_status(
            status="pending",
            owner_id=owner_id
        )
        
        completed_notes = await self.get_notes_by_status(
            status="completed",
            owner_id=owner_id
        )
        
        overdue_notes = await self.get_overdue_notes(
            owner_id=owner_id
        )
        
        return {
            "total_pending": len(pending_notes),
            "total_completed": len(completed_notes),
            "total_overdue": len(overdue_notes),
            "completion_rate": len(completed_notes) / (len(pending_notes) + len(completed_notes)) * 100 if (len(pending_notes) + len(completed_notes)) > 0 else 0
        }
    
    async def get_calendar_statistics(
        self,
        owner_id: int
    ) -> dict:
        """获取日历统计信息"""
        # 获取各状态的数量
        pending_calendars = await self.get_calendars_by_status(
            status="pending",
            owner_id=owner_id
        )
        
        completed_calendars = await self.get_calendars_by_status(
            status="completed",
            owner_id=owner_id
        )
        
        overdue_calendars = await self.get_overdue_calendars(
            owner_id=owner_id
        )
        
        return {
            "total_pending": len(pending_calendars),
            "total_completed": len(completed_calendars),
            "total_overdue": len(overdue_calendars),
            "completion_rate": len(completed_calendars) / (len(pending_calendars) + len(completed_calendars)) * 100 if (len(pending_calendars) + len(completed_calendars)) > 0 else 0
        }
    
    async def _log_activity(
        self,
        user_id: int,
        action: str,
        resource_type: str,
        resource_id: int,
        metadata: Optional[dict] = None
    ):
        """记录用户活动日志"""
        try:
            from app.crud.crud_user_activity_log import crud_user_activity_log
            
            log_data = {
                "user_id": user_id,
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "activity_metadata": metadata or {}
            }
            
            crud_user_activity_log.create(db=self.db, obj_in=log_data)
        except Exception as e:
            # 日志记录失败不应该影响主要功能
            print(f"Failed to log activity: {e}")
