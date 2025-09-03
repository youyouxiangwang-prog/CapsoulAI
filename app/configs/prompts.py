from typing import Dict, Any

class PromptTemplates:
    """集中管理所有Prompt模板"""
    
    CONVERSATION_ANALYSIS = """
    请分析以下对话内容：
    
    标题：{title}
    时长：{duration}秒
    转录内容：
    {transcription}
    
    请提供以下分析：
    1. 对话摘要（200字以内）
    2. 关键要点（3-5个要点）
    3. 情感分析（积极/中性/消极）
    4. 行动项目（如果有）
    5. 重要时间点和决策点
    
    请以JSON格式返回结果。
    """
    
    TASK_EXTRACTION = """
    从以下对话中提取待办事项和任务：
    
    对话内容：{content}
    
    请识别：
    1. 明确的任务和待办事项
    2. 截止日期和时间要求
    3. 负责人信息
    4. 优先级指标
    
    返回JSON格式的任务列表。
    """
    
    SCHEDULE_EXTRACTION = """
    从以下对话中提取日程和安排：
    
    对话内容：{content}
    
    请识别：
    1. 会议和约会
    2. 时间和地点
    3. 参与人员
    4. 重要性级别
    
    返回JSON格式的日程列表。
    """
    
    SEARCH_ENHANCEMENT = """
    用户搜索："{query}"
    
    请帮助生成相关的搜索关键词和同义词，以提高搜索准确性。
    考虑：
    1. 同义词和相关词汇
    2. 不同的表达方式
    3. 上下文相关的术语
    
    返回扩展的搜索词列表。
    """
    
    SUMMARY_GENERATION = """
    请为以下选定的内容生成综合摘要：
    
    内容类型：{content_type}
    时间范围：{date_range}
    包含项目：
    {items}
    
    请生成：
    1. 整体摘要
    2. 关键洞察
    3. 趋势分析
    4. 建议和下一步行动
    
    返回结构化的摘要报告。
    """
    
    RECOMMENDATION_PROMPT = """
    基于用户的活动历史和当前上下文，生成个性化推荐：
    
    用户活动模式：{activity_pattern}
    当前时间：{current_time}
    最近活动：{recent_activities}
    
    请提供：
    1. 温馨提醒
    2. 行动建议
    3. 相关资源推荐
    4. 激励性语录
    
    返回个性化推荐列表。
    """
    
    @classmethod
    def get_template(cls, template_name: str) -> str:
        """获取指定的prompt模板"""
        return getattr(cls, template_name, "")
    
    @classmethod
    def format_template(cls, template_name: str, **kwargs) -> str:
        """格式化prompt模板"""
        template = cls.get_template(template_name)
        if template:
            return template.format(**kwargs)
        return ""
