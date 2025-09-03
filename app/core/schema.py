from typing import Dict, Any

class DatabaseSchema:
    """数据库表和字段的解释，用于生成查询语句"""
    
    TABLES = {
        "users": {
            "description": "用户表，存储用户账户信息",
            "fields": {
                "id": "用户唯一标识",
                "email": "用户邮箱",
                "hashed_password": "密码哈希",
                "is_active": "是否激活",
                "created_at": "创建时间",
                "updated_at": "更新时间"
            }
        },
        "conversations": {
            "description": "对话表，存储录音会话信息",
            "fields": {
                "id": "对话唯一标识",
                "title": "对话标题",
                "owner_id": "所属用户ID",
                "source_path": "音频文件URL",
                "duration": "时长（秒）",
                "transcription_status": "转录状态",
                "analysis_status": "分析状态",
                "created_at": "创建时间",
                "updated_at": "更新时间"
            }
        },
        "segments": {
            "description": "音频分段表，存储音频的时间分段",
            "fields": {
                "id": "分段唯一标识",
                "conversation_id": "所属对话ID",
                "start_time": "开始时间",
                "end_time": "结束时间",
                "speaker_id": "说话人ID",
                "created_at": "创建时间"
            }
        },
        "lines": {
            "description": "文本行表，存储转录的文本内容",
            "fields": {
                "id": "文本行唯一标识",
                "segment_id": "所属分段ID",
                "text": "文本内容",
                "confidence": "置信度",
                "created_at": "创建时间"
            }
        },
        "items": {
            "description": "规划项表，存储待办事项、日程、笔记",
            "fields": {
                "id": "项目唯一标识",
                "title": "标题",
                "description": "描述",
                "type": "类型（task/schedule/note）",
                "status": "状态（pending/completed/ignored）",
                "owner_id": "所属用户ID",
                "due_date": "截止日期",
                "priority": "优先级",
                "created_at": "创建时间",
                "updated_at": "更新时间"
            }
        },
        "speakers": {
            "description": "说话人表，存储说话人信息",
            "fields": {
                "id": "说话人唯一标识",
                "name": "姓名",
                "description": "描述",
                "created_at": "创建时间"
            }
        },
        "voiceprints": {
            "description": "声纹表，存储说话人声纹信息",
            "fields": {
                "id": "声纹唯一标识",
                "speaker_id": "所属说话人ID",
                "features": "声纹特征数据",
                "source_path": "训练音频URL",
                "created_at": "创建时间"
            }
        },
        "relationships": {
            "description": "关系表，存储实体间的关系",
            "fields": {
                "id": "关系唯一标识",
                "source_type": "源实体类型",
                "source_id": "源实体ID",
                "target_type": "目标实体类型",
                "target_id": "目标实体ID",
                "relation_type": "关系类型",
                "relation_metadata": "关系元数据",
                "created_at": "创建时间"
            }
        },
        "user_activity_logs": {
            "description": "用户活动日志表",
            "fields": {
                "id": "日志唯一标识",
                "user_id": "用户ID",
                "action": "操作类型",
                "resource_type": "资源类型",
                "resource_id": "资源ID",
                "activity_metadata": "操作元数据",
                "created_at": "创建时间"
            }
        }
    }
    
    @classmethod
    def get_table_info(cls, table_name: str) -> Dict[str, Any]:
        """获取表信息"""
        return cls.TABLES.get(table_name, {})
    
    @classmethod
    def get_all_tables(cls) -> Dict[str, Any]:
        """获取所有表信息"""
        return cls.TABLES
