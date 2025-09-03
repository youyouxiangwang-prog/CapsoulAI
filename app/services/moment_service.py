from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import logging
from app.models.moment import MomentRead, GeneratedSummary, FilterRequest, RecommendationRequest
from app.services.analysis_service import AnalysisService
from app.schemas import Conversation, Segment, Task, Note, Schedule, Reminder, Line
from app.utils.openai_chat import chat_with_azure_openai
from app.crud.crud_segment import crud_segment
from app.crud.crud_task import crud_task
from app.crud.crud_note import crud_note
from app.crud.crud_schedule import crud_schedule
from app.crud.crud_reminder import crud_reminder
from app.crud.crud_line import crud_line
from app.crud.crud_conversation import crud_conversation

class MomentService:
    """Core business logic for moments and summary functionality"""
    
    def __init__(self, db: Session):
        self.db = db
        self.analysis_service = AnalysisService()
        self.logger = logging.getLogger(__name__)
    
    async def filter_moments(
        self,
        filter_criteria: FilterRequest,
        tenant_id: int
    ) -> List[MomentRead]:
        """Filter moments/events based on user criteria"""
        # TODO: Implement filtering logic based on criteria
        # This needs to query relevant data based on FilterRequest conditions
        
        moments = []
        
        # Example filtering logic
        if filter_criteria.types:
            # Filter by types
            pass
        
        if filter_criteria.start_date and filter_criteria.end_date:
            # Filter by date range
            pass
        
        if filter_criteria.keywords:
            # Filter by keywords
            pass
        
        # Return sample data
        return [
            MomentRead(
                id=1,
                type="conversation",
                content="Sample moment content",
                created_at="2025-08-11T10:00:00"
            )
        ]
    
    async def get_recommendations(
        self,
        request: RecommendationRequest,
        tenant_id: int
    ) -> List[MomentRead]:
        """Generate real-time recommendations for reminders or quotes based on user behavior"""
        # TODO: Implement recommendation algorithm
        
        # Get user's recent activities
        recent_activities = await self._get_recent_user_activities(tenant_id)
        
        # Generate recommendations based on activity patterns
        recommendations = await self._generate_recommendations(
            tenant_id=tenant_id,
            activities=recent_activities,
            context=request.context,
            limit=request.limit
        )
        
        return recommendations
    
    async def generate_summary(
        self,
        moment_ids: List[int],
        tenant_id: int
    ) -> GeneratedSummary:
        """Generate one-click summary from user-filtered data"""
        # Get relevant moment data
        moments_data = await self._get_moments_by_ids(moment_ids, tenant_id)
        
        if not moments_data:
            raise ValueError("No valid moments found for summary generation")
        
        # Prepare analysis data
        analysis_input = {
            "moments": moments_data,
            "tenant_id": tenant_id,
            "summary_type": "comprehensive"
        }
        
        # Call analysis service to generate summary
        analysis_result = await self.analysis_service.execute_analysis(analysis_input)
        
        # Build summary response
        from datetime import datetime
        
        summary = GeneratedSummary(
            summary=analysis_result.get("summary", "Generated summary based on selected moments"),
            insights=analysis_result.get("insights", ["Key insight 1", "Key insight 2"]),
            recommendations=analysis_result.get("recommendations", ["Recommendation 1", "Recommendation 2"]),
            generated_at=datetime.utcnow()
        )
        
        # Log user activity
        await self._log_activity(
            tenant_id=tenant_id,
            action="generate_summary",
            resource_type="moment_summary",
            metadata={
                "moment_count": len(moment_ids),
                "moment_ids": moment_ids
            }
        )
        
        return summary
    
    async def _get_recent_user_activities(self, tenant_id: int) -> List[Dict[str, Any]]:
        """Get user's recent activities"""
        try:
            from app.crud.crud_user_activity_log import crud_user_activity_log
            
            activities = crud_user_activity_log.get_recent_activities(
                db=self.db,
                tenant_id=tenant_id,
                hours=24,
                limit=50
            )
            
            return [
                {
                    "action": activity.action,
                    "resource_type": activity.resource_type,
                    "created_at": activity.created_at,
                    "activity_metadata": activity.activity_metadata
                }
                for activity in activities
            ]
        except Exception as e:
            self.logger.error(f"Failed to get recent activities: {e}")
            return []
    
    async def _generate_recommendations(
        self,
        tenant_id: int,
        activities: List[Dict[str, Any]],
        context: Optional[str],
        limit: int
    ) -> List[MomentRead]:
        """Generate personalized recommendations"""
        recommendations = []
        
        # Recommendation logic based on activity patterns
        activity_count = len(activities)
        
        if activity_count == 0:
            # Recommendations for new or inactive users
            recommendations.append(
                MomentRead(
                    id=0,
                    type="welcome",
                    content="Welcome to CapsoulAI! Start recording your first conversation.",
                    created_at="2025-08-11T10:00:00"
                )
            )
        else:
            # Recommendations for active users
            recent_conversations = [a for a in activities if a.get("resource_type") == "conversation"]
            
            if len(recent_conversations) > 0:
                recommendations.append(
                    MomentRead(
                        id=0,
                        type="insight",
                        content="Your recent conversations show great communication patterns, keep it up!",
                        created_at="2025-08-11T10:00:00"
                    )
                )
        
        return recommendations[:limit]
    
    async def _get_moments_by_ids(
        self,
        moment_ids: List[int],
        tenant_id: int
    ) -> List[Dict[str, Any]]:
        """Get moment data by IDs"""
        # TODO: Implement logic to get moment data from database
        # This needs to be based on specific data models
        
        moments = []
        
        for moment_id in moment_ids:
            # Simulate data retrieval
            moment_data = {
                "id": moment_id,
                "content": f"Moment content for ID {moment_id}",
                "type": "conversation",
                "created_at": "2025-08-11T10:00:00",
                "tenant_id": tenant_id
            }
            moments.append(moment_data)
        
        return moments
    
    async def _log_activity(
        self,
        tenant_id: int,
        action: str,
        resource_type: str,
        resource_id: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log user activity"""
        try:
            from app.crud.crud_user_activity_log import crud_user_activity_log
            
            log_data = {
                "tenant_id": tenant_id,
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "activity_metadata": metadata or {}
            }
            
            crud_user_activity_log.create(db=self.db, obj_in=log_data)
        except Exception as e:
            self.logger.error(f"Failed to log activity: {e}")

    async def get_dashboard_data(self, timeframe: str, tenant_id: int) -> Dict[str, Any]:
        """Get dashboard data from real database queries"""
        try:
            # Get time range
            start_date, end_date = self._get_time_range(timeframe)
            
            # Get time overview data from real conversations
            time_overview = await self._get_time_overview_from_db(start_date, end_date, tenant_id)
            
            # Generate AI recap using real data
            ai_recap = await self._generate_ai_recap_from_db(start_date, end_date, tenant_id)
            
            # Get key points from real tasks and schedules
            key_points = await self._get_key_points_from_db(start_date, end_date, tenant_id)
            
            # Get meaningful quote from real conversation data
            quote = await self._get_meaningful_quote_from_db(start_date, end_date, tenant_id)
            
            return {
                "time_overview": time_overview,
                "ai_recap": ai_recap,
                "key_points": key_points,
                "quote": quote
            }
        except Exception as e:
            self.logger.error(f"Error getting dashboard data: {e}")
            raise Exception(f"Failed to retrieve dashboard data: {str(e)}")
    
    def _get_time_range(self, timeframe: str) -> tuple:
        """Get start and end time based on timeframe"""
        now = datetime.now()
        
        if timeframe == "today":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        elif timeframe == "week":
            start_date = now - timedelta(days=now.weekday())
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59)
        elif timeframe == "month":
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if now.month == 12:
                end_date = now.replace(year=now.year + 1, month=1, day=1) - timedelta(microseconds=1)
            else:
                end_date = now.replace(month=now.month + 1, day=1) - timedelta(microseconds=1)
        elif timeframe == "year":
            start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(month=12, day=31, hour=23, minute=59, second=59, microsecond=999999)
        else:
            # Default to today
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        return start_date, end_date
    
    async def _get_time_overview_from_db(self, start_date: datetime, end_date: datetime, tenant_id: int) -> List[Dict[str, Any]]:
        """Get time overview data from actual database using direct queries and AI categorization"""
        try:
            # Get conversations within the timeframe using direct query
            conversations = self.db.query(Conversation).filter(
                and_(
                    Conversation.tenant_id == tenant_id,
                    Conversation.started_at >= start_date,
                    Conversation.started_at <= end_date
                )
            ).all()
            
            if not conversations:
                return []
            
            # Prepare conversation data for AI categorization
            conversation_data = []
            for conv in conversations:
                # Get related lines for this conversation using CRUD
                lines = crud_line.search_by_keywords(
                    db=self.db,
                    keywords=None,  # Get all lines for this conversation  
                    tenant_id=tenant_id,
                    time_range={
                        "start": conv.started_at.isoformat() if conv.started_at else start_date.isoformat(),
                        "end": conv.ended_at.isoformat() if conv.ended_at else end_date.isoformat()
                    }
                )[:10]  # Limit to 10 lines
                
                content = " ".join([line.text for line in lines if line.text]) if lines else ""
                conversation_data.append({
                    "title": conv.title or "",
                    "topics": conv.topics or "",
                    "summary": conv.summary or "",
                    "content_sample": content[:500]  # First 500 chars
                })
            
            # Use AI to categorize conversations (similar to retrieval_service prompt structure)
            categorization_prompt = f"""
            You are an expert data analyst. Analyze the following {len(conversation_data)} conversations and categorize them into Work, Family, Learning, and Personal categories.
            
            Instructions:
            1. Analyze each conversation's title, topics, summary, and content sample
            2. Categorize based on context and keywords
            3. Return ONLY a JSON object with counts for each category
            
            Conversations to analyze:
            {json.dumps(conversation_data, indent=2, ensure_ascii=False)}
            
            Expected JSON format:
            {{"Work": 0, "Family": 0, "Learning": 0, "Personal": 0}}
            """
            
            try:
                ai_response = chat_with_azure_openai(categorization_prompt, temperature=0.1)
                # Clean response like in retrieval_service
                if "```json" in ai_response:
                    ai_response = ai_response.split("```json")[1].split("```")[0]
                categories = json.loads(ai_response.strip())
            except Exception as e:
                self.logger.error(f"AI categorization failed: {e}")
                # Fallback to keyword-based categorization
                categories = self._categorize_conversations_by_keywords(conversation_data)
            
            # Convert to percentage-based visualization data
            total = sum(categories.values())
            if total == 0:
                return []
            
            colors = {
                'Work': '#3b82f6',
                'Family': '#8b5cf6', 
                'Learning': '#10b981',
                'Personal': '#f97316'
            }
            
            result = []
            for name, count in categories.items():
                percentage = round((count / total) * 100)
                if percentage > 0:
                    result.append({
                        'name': name,
                        'value': percentage,
                        'color': colors[name]
                    })
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error getting time overview from DB: {e}")
            return []
    
    def _categorize_conversations_by_keywords(self, conversation_data: List[Dict]) -> Dict[str, int]:
        """Fallback categorization using keyword matching"""
        categories = {'Work': 0, 'Family': 0, 'Learning': 0, 'Personal': 0}
        
        for conv in conversation_data:
            content = f"{conv.get('title', '')} {conv.get('topics', '')} {conv.get('summary', '')} {conv.get('content_sample', '')}".lower()
            
            if any(keyword in content for keyword in ['work', 'project', 'meeting', 'business', 'client', 'team', 'office', 'job', 'company']):
                categories['Work'] += 1
            elif any(keyword in content for keyword in ['family', 'child', 'parent', 'home', 'dinner', 'weekend', 'mom', 'dad', 'kids', 'spouse']):
                categories['Family'] += 1
            elif any(keyword in content for keyword in ['learn', 'study', 'course', 'education', 'book', 'knowledge', 'school', 'university', 'training']):
                categories['Learning'] += 1
            else:
                categories['Personal'] += 1
        
        return categories

    async def _generate_ai_recap_from_db(self, start_date: datetime, end_date: datetime, tenant_id: int) -> str:
        """Generate AI recap using real database data and direct queries"""
        try:
            # Get comprehensive stats using direct queries
            conversations = self.db.query(Conversation).filter(
                and_(
                    Conversation.tenant_id == tenant_id,
                    Conversation.started_at >= start_date,
                    Conversation.started_at <= end_date
                )
            ).all()
            conversations_count = len(conversations)
            
            tasks = self.db.query(Task).filter(
                and_(
                    Task.tenant_id == tenant_id,
                    Task.created_at >= start_date,
                    Task.created_at <= end_date
                )
            ).all()
            tasks_count = len(tasks)
            
            notes = self.db.query(Note).filter(
                and_(
                    Note.tenant_id == tenant_id,
                    Note.created_at >= start_date,
                    Note.created_at <= end_date
                )
            ).all()
            notes_count = len(notes)
            
            schedules = self.db.query(Schedule).filter(
                and_(
                    Schedule.tenant_id == tenant_id,
                    Schedule.started_at >= start_date,
                    Schedule.started_at <= end_date
                )
            ).all()
            schedules_count = len(schedules)
            
            # Get recent conversation topics and summaries
            topics = [conv.title for conv in conversations[:5] if conv.title]
            summaries = [conv.summary for conv in conversations[:5] if conv.summary]
            
            # Get meaningful lines for emotional context and relationships using CRUD
            meaningful_lines = crud_line.search_by_keywords(
                db=self.db,
                keywords="love thank proud best wonderful amazing grateful appreciate happy joy",
                tenant_id=tenant_id,
                time_range={
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat()
                }
            )[:10]
            
            # Get speaker information for warmer context
            speakers_mentioned = []
            try:
                from app.crud.crud_speaker import crud_speaker
                for line in meaningful_lines[:5]:
                    if hasattr(line, 'speaker_id') and line.speaker_id:
                        speaker = crud_speaker.get(db=self.db, id=line.speaker_id)
                        if speaker and speaker.name and speaker.name not in speakers_mentioned:
                            speakers_mentioned.append(speaker.name)
            except Exception as e:
                self.logger.debug(f"Could not get speaker info: {e}")
            
            # Generate personalized recap using AI (similar to retrieval_service summarization)
            timeframe_str = f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
            
            relationships_context = f"Had meaningful interactions with: {', '.join(speakers_mentioned[:3])}" if speakers_mentioned else "Engaged in various conversations"
            
            recap_prompt = f"""Generate a warm, encouraging summary for the user based on their activity data.

Activity Summary for {timeframe_str}:
- Conversations: {conversations_count}
- Tasks: {tasks_count}  
- Notes: {notes_count}
- Events: {schedules_count}

Topics discussed: {', '.join(topics[:3]) if topics else 'No specific topics'}
Key insights: {'. '.join(summaries[:2]) if summaries else 'No detailed insights'}
{relationships_context}
Positive moments: {'. '.join([line.text[:50] + '...' for line in meaningful_lines[:3]]) if meaningful_lines else 'No highlighted moments'}

Please write a warm, encouraging paragraph (maximum 120 words) that highlights the user's productivity, positive engagement, and meaningful connections. Focus on their achievements, growth, and relationships. Write in a supportive, personal tone as plain text without any formatting."""
            
            try:
                recap = chat_with_azure_openai(recap_prompt, temperature=0.7)
                # Clean any potential JSON formatting
                recap_text = recap.strip()
                if recap_text.startswith('"') and recap_text.endswith('"'):
                    recap_text = recap_text[1:-1]
                if recap_text.startswith('{') or recap_text.startswith('['):
                    # Extract text from JSON if AI returns JSON despite instructions
                    try:
                        import re
                        # Try to extract text content from JSON-like response
                        text_match = re.search(r'"(?:text|content|recap|summary)":\s*"([^"]+)"', recap_text)
                        if text_match:
                            recap_text = text_match.group(1)
                    except:
                        pass
                
                # Check if the response contains error messages
                if "error" in recap_text.lower() or "invalid" in recap_text.lower() or len(recap_text.strip()) < 10:
                    raise ValueError("AI returned an error or invalid response")
                    
                return recap_text
            except Exception as ai_error:
                self.logger.error(f"AI recap generation failed: {ai_error}")
                # Return a personalized fallback based on actual data
                if conversations_count > 0 or tasks_count > 0 or notes_count > 0 or schedules_count > 0:
                    activities = []
                    if conversations_count > 0:
                        activities.append(f"{conversations_count} conversation{'s' if conversations_count > 1 else ''}")
                    if tasks_count > 0:
                        activities.append(f"{tasks_count} task{'s' if tasks_count > 1 else ''}")
                    if notes_count > 0:
                        activities.append(f"{notes_count} note{'s' if notes_count > 1 else ''}")
                    if schedules_count > 0:
                        activities.append(f"{schedules_count} event{'s' if schedules_count > 1 else ''}")
                    
                    activity_text = ", ".join(activities)
                    return f"You've been productive with {activity_text} during this period. Keep up the great work maintaining an active and engaged approach to your daily life!"
                else:
                    return "Welcome to CapsoulAI! Start recording conversations and managing tasks to see personalized insights about your activities."
            
        except Exception as e:
            self.logger.error(f"Error generating AI recap from DB: {e}")
            return "You've been actively engaging in conversations and managing your activities. Keep up the great work maintaining a balanced approach to your daily life!"
    
    async def _get_key_points_from_db(self, start_date: datetime, end_date: datetime, tenant_id: int) -> Dict[str, List[Dict[str, Any]]]:
        """Get key points from real database using direct queries and AI analysis"""
        try:
            # Get all entities using direct queries
            tasks = self.db.query(Task).filter(
                and_(
                    Task.tenant_id == tenant_id,
                    Task.created_at >= start_date,
                    Task.created_at <= end_date
                )
            ).all()
            
            schedules = self.db.query(Schedule).filter(
                and_(
                    Schedule.tenant_id == tenant_id,
                    Schedule.started_at >= start_date,
                    Schedule.started_at <= end_date
                )
            ).all()
            
            notes = self.db.query(Note).filter(
                and_(
                    Note.tenant_id == tenant_id,
                    Note.created_at >= start_date,
                    Note.created_at <= end_date
                )
            ).limit(10).all()  # Limit to 10 recent notes
            
            # Prepare data for AI analysis (similar to retrieval_service data preparation)
            task_data = []
            for task in tasks:
                task_info = {
                    "content": task.content if hasattr(task, 'content') and task.content else "No content",
                    "status": task.status if hasattr(task, 'status') and task.status else "unknown",
                    "temporal": task.temporal if hasattr(task, 'temporal') and task.temporal else "none"
                }
                task_data.append(task_info)
            
            schedule_data = []
            for schedule in schedules:
                schedule_info = {
                    "content": schedule.content if hasattr(schedule, 'content') and schedule.content else "No content",
                    "status": schedule.status if hasattr(schedule, 'status') and schedule.status else "unknown"
                }
                schedule_data.append(schedule_info)
            
            note_data = []
            for note in notes:
                note_info = {
                    "content": note.content if hasattr(note, 'content') and note.content else "No content",
                    "status": note.status if hasattr(note, 'status') else "unknown"
                }
                note_data.append(note_info)
            
            if not task_data and not schedule_data and not note_data:
                return {"work": [], "family": []}
            
            # Use AI to categorize and generate key points (similar to retrieval_service prompt style)
            categorization_prompt = f"""
            You are an expert productivity analyst. Analyze the following user data and generate actionable key points.
            
            CRITICAL INSTRUCTIONS:
            1. Categorize insights into "work" and "family" categories
            2. Each point should be concise and actionable (max 50 characters)
            3. Choose appropriate icons from: Briefcase, Users, Book, Calendar, Heart, Utensils, Home, Clock
            4. Generate 2-4 points per category based on actual data
            5. Return ONLY valid JSON, no other text
            
            User Data to Analyze:
            Tasks: {json.dumps(task_data[:10], indent=2, ensure_ascii=False)}
            Schedules: {json.dumps(schedule_data[:10], indent=2, ensure_ascii=False)}
            Notes: {json.dumps(note_data[:10], indent=2, ensure_ascii=False)}
            
            Expected JSON Output Format:
            {{
                "work": [
                    {{"text": "Review project progress", "icon": "Briefcase"}},
                    {{"text": "Prepare team meeting", "icon": "Users"}}
                ],
                "family": [
                    {{"text": "Plan weekend activities", "icon": "Heart"}},
                    {{"text": "Schedule family dinner", "icon": "Utensils"}}
                ]
            }}
            """
            
            try:
                ai_response = chat_with_azure_openai(categorization_prompt, temperature=0.3)
                # Clean response like in retrieval_service
                if "```json" in ai_response:
                    ai_response = ai_response.split("```json")[1].split("```")[0]
                key_points = json.loads(ai_response.strip())
                
                # Validate response structure
                if not isinstance(key_points, dict) or "work" not in key_points or "family" not in key_points:
                    raise ValueError("Invalid AI response structure")
                    
                return key_points
                
            except Exception as e:
                self.logger.error(f"AI key points generation failed: {e}")
                # Fallback to direct database extraction
                return self._extract_key_points_from_data(tasks, schedules, notes)
            
        except Exception as e:
            self.logger.error(f"Error getting key points from DB: {e}")
            return {"work": [], "family": []}

    def _extract_key_points_from_data(self, tasks, schedules, notes) -> Dict[str, List[Dict[str, Any]]]:
        """Fallback method to extract key points directly from data"""
        work_points = []
        family_points = []
        
        # Analyze tasks
        for task in tasks[:5]:  # Limit to recent 5 tasks
            if task.content:
                content_lower = task.content.lower()
                if any(keyword in content_lower for keyword in ['work', 'project', 'meeting', 'business', 'client', 'team']):
                    work_points.append({
                        'text': task.content[:50] + '...' if len(task.content) > 50 else task.content,
                        'icon': 'Briefcase'
                    })
                elif any(keyword in content_lower for keyword in ['family', 'home', 'dinner', 'weekend', 'kids']):
                    family_points.append({
                        'text': task.content[:50] + '...' if len(task.content) > 50 else task.content,
                        'icon': 'Heart'
                    })
        
        # Analyze schedules
        for schedule in schedules[:3]:  # Limit to recent 3 schedules
            if schedule.content:
                content_lower = schedule.content.lower()
                if any(keyword in content_lower for keyword in ['work', 'meeting', 'business', 'client']):
                    work_points.append({
                        'text': schedule.content[:50] + '...' if len(schedule.content) > 50 else schedule.content,
                        'icon': 'Calendar'
                    })
                elif any(keyword in content_lower for keyword in ['family', 'dinner', 'weekend', 'home']):
                    family_points.append({
                        'text': schedule.content[:50] + '...' if len(schedule.content) > 50 else schedule.content,
                        'icon': 'Utensils'
                    })
        
        # Ensure we have at least some points
        if not work_points:
            work_points = [
                {'text': 'Review recent work activities', 'icon': 'Briefcase'},
                {'text': 'Plan upcoming tasks', 'icon': 'Book'}
            ]
        
        if not family_points:
            family_points = [
                {'text': 'Schedule quality family time', 'icon': 'Heart'},
                {'text': 'Plan family activities', 'icon': 'Home'}
            ]
        
        return {
            'work': work_points[:4],  # Limit to 4 points max
            'family': family_points[:4]
        }
    
    async def _get_meaningful_quote_from_db(self, start_date: datetime, end_date: datetime, tenant_id: int) -> str:
        """Get the most meaningful quote by analyzing the segment with the most recent activities."""
        try:
            # Step 1: Find the segment with the most recent activities
            segment_counts = (
                self.db.query(
                    Segment.id,
                    func.count(Task.id + Note.id + Reminder.id + Schedule.id).label("activity_count")
                )
                .join(Task, Task.segment_id == Segment.id, isouter=True)
                .join(Note, Note.segment_id == Segment.id, isouter=True)
                .join(Reminder, Reminder.segment_id == Segment.id, isouter=True)
                .join(Schedule, Schedule.segment_id == Segment.id, isouter=True)
                .filter(Segment.tenant_id == tenant_id)
                .filter(Segment.created_at.between(start_date, end_date))
                .group_by(Segment.id)
                .order_by(desc("activity_count"))
                .first()
            )

            if not segment_counts:
                return "No recent activities found to generate a meaningful quote."

            segment_id = segment_counts[0]

            # Step 2: Retrieve lines from the most active segment
            lines = self.db.query(Line).filter(
                Line.segment_id == segment_id,
                Line.tenant_id == tenant_id
            ).all()

            if not lines:
                return "No meaningful lines found in the most active segment."

            # Step 3: Use AI to select the most meaningful/warm line
            line_data = [
                {
                    "text": line.text,
                    "speaker": "Speaker A",
                    "time": line.started_at.strftime("%Y-%m-%d %H:%M:%S") if line.started_at else "Unknown time"
                }
                for line in lines if line.text
            ]

            ai_prompt = f"""
            You are an expert at identifying warm, meaningful, and inspirational moments in conversations.

            From the following lines, select the ONE most warm, meaningful, or inspirational line:
            {json.dumps(line_data, indent=2, ensure_ascii=False)}

            INSTRUCTIONS:
            1. Look for lines that express gratitude, love, appreciation, encouragement, achievements, or positive emotions.
            2. Prefer lines that show human connection and warmth.
            3. Avoid mundane or negative content.
            4. Return ONLY the information in the format and no extra text.:
               "[Line] - [Speaker], [Time]"
                e.g. "I know that will be hard, but I decided to go for it. - Speaker A, 2025-08-26 20:55:29"
        """

            selected_line = chat_with_azure_openai(ai_prompt, temperature=0.7,
            response_format={"type": "text"},system_content="").strip()

            # Ensure the output is clean and formatted correctly
            if not selected_line or len(selected_line.strip()) < 10:
                return "No meaningful quote could be generated."
            return selected_line

        except Exception as e:
            self.logger.error(f"Error generating meaningful quote: {e}")
            return "An error occurred while generating a meaningful quote."

