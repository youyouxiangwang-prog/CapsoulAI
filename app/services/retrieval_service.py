"""
Refactored Query Agent for Knowledge Graph
This module provides a clean interface for querying the knowledge graph with ancestry tracking
"""

import json
from sqlalchemy.orm import Session
from app.utils.openai_chat import chat_with_azure_openai
from app.models.moment import Node, Edge, SearchResult
from app.schemas import Segment, Task, Note, Schedule, Reminder, Conversation, Line
from app.utils.schema_generator import generate_schema_description
from app.crud.crud_segment import crud_segment
from app.crud.crud_task import crud_task
from app.crud.crud_note import crud_note
from app.crud.crud_schedule import crud_schedule
from app.crud.crud_reminder import crud_reminder
from app.crud.crud_line import crud_line
from app.crud.crud_relationship import crud_relationship
from app.crud.crud_conversation import crud_conversation


def _get_system_prompt():
    # Dynamically generate the schema description
    schema_desc = generate_schema_description()
    
    return f"""
    You are an expert query planner for a PostgreSQL database. Your task is to translate user questions into a structured JSON object that can be used to query the database with SQLAlchemy.

    {schema_desc}

    ## CRITICAL INSTRUCTIONS
    1.  **JSON OUTPUT ONLY**: Your output MUST be a single, valid JSON object and nothing else.
    2.  **ENTITY IDENTIFICATION**: Identify the primary entity or entities the user is asking about (e.g., "task", "note", "segment"). List them in the `entities` field.
    3.  **KEYWORD EXTRACTION**: Extract the core keywords from the user's query for text searching. Put them in the `keywords` field.
    4.  **TIME RANGE DETECTION**: If the user specifies a time range (e.g., "yesterday", "last week", "in July"), identify the start and end times in ISO 8601 format. Put them in the `time_range` field. If no time is mentioned, set it to `null`.
        - "yesterday": `{{ "start": "2025-08-22T00:00:00", "end": "2025-08-22T23:59:59" }}` (Today is 2025-08-23)
        - "last 7 days": `{{ "start": "2025-08-16T00:00:00", "end": "2025-08-23T23:59:59" }}`
    5.  **RELATIONSHIP AWARENESS**: If the query implies a relationship (e.g., "tasks from the conversation about 'Project X'"), identify the source entity and its filters.
    6.  **GRANULARITY**: Set `granularity` to "fine" only if the user asks for deep content analysis (e.g., "what did we say about..."). Otherwise, default to "coarse".

    ## EXAMPLES

    ### Example 1: Find tasks about 'project kickoff'
    - User Question: "Show all tasks related to 'project kickoff'."
    - Your Correct JSON Output:
      ```json
      {{
        "plan": "Find tasks with keywords 'project kickoff'.",
        "entities": ["task"],
        "keywords": "project kickoff",
        "time_range": null,
        "granularity": "coarse"
      }}
      ```

    ### Example 2: Find notes from last week
    - User Question: "List all notes from last week."
    - Your Correct JSON Output:
      ```json
      {{
        "plan": "Find all notes created in the last 7 days.",
        "entities": ["note"],
        "keywords": null,
        "time_range": {{ "start": "2025-08-16T00:00:00", "end": "2025-08-23T23:59:59" }},
        "granularity": "coarse"
      }}
      ```
    
    ### Example 3: Find segments that mention 'Jen'
    - User Question: "Show all events where 'Jen' was mentioned."
    - Your Correct JSON Output:
      ```json
      {{
        "plan": "Find segments where 'Jen' is mentioned in the transcript.",
        "entities": ["segment"],
        "keywords": "Jen",
        "time_range": null,
        "granularity": "coarse"
      }}
      ```
    
    ### Example 4: Find lines containing specific content
    - User Question: "Show all lines that mention 'budget discussion'."
    - Your Correct JSON Output:
      ```json
      {{
        "plan": "Find lines with content matching 'budget discussion'.",
        "entities": ["line"],
        "keywords": "budget discussion",
        "time_range": null,
        "granularity": "fine"
      }}
      ```

    ### Example 5: Search for 'travel'
    - User Question: "Search travel"
    - Your Correct JSON Output:
      ```json
      {{
        "plan": "Find all entities with keywords 'travel'.",
        "entities": ["conversation", "segment", "task", "note", "schedule", "reminder", "line"],
        "keywords": "travel",
        "time_range": null,
        "granularity": "coarse"
      }}
      ```
    """

# --- Planner: Generates a query plan ---
class Planner:
    def __init__(self, llm_api_key=None):
        pass  # Not needed for Azure OpenAI

    def plan(self, user_input: str, tenant_id: int):
        system_prompt = _get_system_prompt()
        prompt = f"{system_prompt}\n\nUser Question: \"{user_input}\"\n\nYour JSON Output:"

        try:
            content = chat_with_azure_openai(prompt, temperature=0.0)
            # Clean the response to get only the JSON
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            plan_json = json.loads(content)
            return plan_json
        except (json.JSONDecodeError, IndexError) as e:
            print(f"Error parsing LLM response, falling back to basic plan. Error: {e}")
            # Fallback to a simple keyword-based plan
            return {
                "plan": f"Fallback: Search for '{user_input}' across all types.",
                "entities": ["segment", "task", "note", "schedule", "reminder", "line"],
                "keywords": user_input,
                "time_range": None,
                "granularity": "coarse"
            }

# --- Executor: Executes Query Plan and generates answer ---
class Executor:
    def __init__(self, db: Session):
        self.db = db

    def execute_query(self, plan: dict, tenant_id: int):
        nodes = []

        keywords = plan.get("keywords")
        entities_to_search = plan.get("entities", [])
        time_range = plan.get("time_range") # Extract time_range
        
        print(f"keywords: {keywords}, entities_to_search: {entities_to_search}, time_range: {time_range}")

        # Store all fetched items to build relationships later
        all_items_map = {} # { "Segment_1": segment_obj, "Task_5": task_obj }

        # 从数据库中做模糊搜索
        for entity_name in entities_to_search:
            results = []
            search_params = {
                "db": self.db,
                "keywords": keywords,
                "tenant_id": tenant_id,
                "time_range": time_range
            }
            if entity_name == "conversation":
                results = crud_conversation.search_by_keywords(**search_params)
            elif entity_name == "segment":
                results = crud_segment.search_by_keywords(**search_params)
            elif entity_name == "task":
                results = crud_task.search_by_keywords(**search_params)
            elif entity_name == "note":
                results = crud_note.search_by_keywords(**search_params)
            elif entity_name == "schedule":
                results = crud_schedule.search_by_keywords(**search_params)
            elif entity_name == "reminder":
                results = crud_reminder.search_by_keywords(**search_params)
            elif entity_name == "line":
                results = crud_line.search_by_keywords(**search_params)

            print(f"Fetched {len(results)} items for entity '{entity_name}' with keywords '{keywords}' and time_range '{time_range}'")
            for item in results:
                all_items_map[f"{item.__class__.__name__}_{item.id}"] = item
        
        # Create nodes from all fetched items
        for element_id, item in all_items_map.items():
            node_type = item.__class__.__name__
            item_dict = {c.name: getattr(item, c.name) for c in item.__table__.columns}
            
            node_id_val = item.id
            # Handle different entity types with different field names
            if node_type == "Line":
                label = item_dict.get('text', '')[:100] + '...' if len(item_dict.get('text', '')) > 100 else item_dict.get('text', f"Line {node_id_val}")
            else:
                label = item_dict.get('title') or item_dict.get('description') or item_dict.get('summary') or f"{node_type} {node_id_val}"
            
            node_id = f"n{element_id}"

            node_obj = Node(
                id=node_id,
                label=label,
                type=node_type,
                data=item_dict
            )
            nodes.append(node_obj)

        # Search只返回匹配的节点，关系构建在Ancestry追踪中处理
        return nodes

class Summarizer:
    def __init__(self, db: Session):
        self.db = db

    def summarize_with_llm(self, user_input, nodes: list[Node]):
        def serialize_nodes(node_list):
            return [node.model_dump() for node in node_list]

        safe_query_result = serialize_nodes(nodes)
        node_count = len(nodes)
                
        prompt = f"""
        Create a concise answer based on the user's question and the query results. Please focus on extracting key events and relationships from the results, and summarize them in a way that directly addresses the user's question.:
        User Question: {user_input}
        The query returned approximately {node_count} nodes. Please extract the key events from these results and describe the significant relationships between the nodes to accurately answer the user's question. Limit your answer to no more than three sentences.
        Query Result Details: {repr(safe_query_result)}
        Don't include any Cypher query or technical details in the answer. Focus on providing a clear and concise summary of the key events and relationships that are relevant to the user's question.
        Don't anwser in json which looks like a JSON object with keys like "summary", "events", "relationships", etc. Instead, provide a natural language summary that captures the essence of the query results without using structured JSON format.  
        ---
        """
        return chat_with_azure_openai(prompt, temperature=0.0)

class SearchAgent:
    """
    Agent for event-centric search and summarization.
    """
    def __init__(self, db: Session, planner=None, executor=None, summarizer=None):
        self.db = db
        self.planner = planner or Planner()
        self.executor = executor or Executor(self.db)
        self.summarizer = summarizer or Summarizer(self.db)

    def search(self, user_query, tenant_id: int, offset=0, limit=20) -> SearchResult:
        """
        Performs a search based on a user query.
        - Uses a planner to create a query plan from the natural language query.
        - Executes the plan to fetch nodes and edges from the database.
        - Generates a summary of the results.
        """
        plan = self.planner.plan(user_query, tenant_id=tenant_id)
        print("Generated Plan:", plan)
        nodes = self.executor.execute_query(plan, tenant_id=tenant_id)  # Search只返回节点
        
        # Transform nodes to include frontend-expected fields
        transformed_nodes = []
        
        for node in nodes:
            # Transform node to include title, date, summary fields
            # Handle different entity types with different field names
            if node.type == "Line":
                title = node.data.get('text', '')[:100] + '...' if len(node.data.get('text', '')) > 100 else node.data.get('text', node.label)
                summary = node.data.get('text', '')
            else:
                title = node.data.get('title') or node.data.get('content') or node.label
                summary = node.data.get('summary') or node.data.get('content', '')
            
            node_data = {
                "id": node.id,
                "type": node.type,
                "title": title,
                "date": node.data.get('start_time') or node.data.get('created_at') or node.data.get('scheduled_time') or node.data.get('started_at'),
                "summary": summary,
                "data": node.data
            }
            
            # Ensure date is in string format
            if node_data["date"] and hasattr(node_data["date"], 'isoformat'):
                node_data["date"] = node_data["date"].isoformat()
            elif not node_data["date"]:
                node_data["date"] = None
                
            transformed_nodes.append(node_data)
        
        # 使用统一的回溯图构建方法
        ancestry_tracker = SegmentAncestryTracker(self.db)
        ancestry_graphs = ancestry_tracker.build_complete_ancestry_graph(transformed_nodes, tenant_id)
        
        # 从ancestry graphs中提取所有节点和边用于统计
        final_nodes = []
        
        for graph in ancestry_graphs:
            # 添加原始节点
            if graph["source_node"] not in final_nodes:
                final_nodes.append(graph["source_node"])
            
            # 添加祖先路径中的节点
            for node in graph["ancestry_path"]:
                if node not in final_nodes:
                    final_nodes.append(node)
            
            # 添加相关segment的节点
            for rel_seg in graph["related_segments"]:
                if rel_seg["node"] not in final_nodes:
                    final_nodes.append(rel_seg["node"])
        
        # Generate summary
        summary = ""
        if nodes:
            raw_summary = self.summarizer.summarize_with_llm(user_query, nodes)
            # Clean up summary if it's in JSON format
            if isinstance(raw_summary, str) and raw_summary.strip().startswith('{'):
                try:
                    parsed = json.loads(raw_summary)
                    summary = parsed.get('summary', raw_summary)
                except json.JSONDecodeError:
                    summary = raw_summary
            else:
                summary = raw_summary
        
        # Calculate stats by entity types using final_nodes (包含新添加的父节点)
        conversation_count = len([n for n in final_nodes if n["type"].lower() == 'conversation'])
        segment_count = len([n for n in final_nodes if n["type"].lower() == 'segment'])
        task_count = len([n for n in final_nodes if n["type"].lower() == 'task'])
        note_count = len([n for n in final_nodes if n["type"].lower() == 'note'])
        schedule_count = len([n for n in final_nodes if n["type"].lower() == 'schedule'])
        reminder_count = len([n for n in final_nodes if n["type"].lower() == 'reminder'])
        line_count = len([n for n in final_nodes if n["type"].lower() == 'line'])

        stats = {
            "conversations": conversation_count,
            "segments": segment_count,
            "tasks": task_count,
            "notes": note_count,
            "schedules": schedule_count,
            "reminders": reminder_count,
            "lines": line_count
        }
        
        return SearchResult(
            summary=summary,
            ancestry_graphs=ancestry_graphs,
            stats=stats
        )

class SegmentAncestryTracker:
    """
    Refactored Ancestry Tracker for segments and entities.
    Leverages SQLAlchemy relationships for traversal.
    """

    def __init__(self, db: Session):
        self.db = db

    def trace_entity_ancestry(self, entity_id, entity_type, user_query=None, tenant_id: int = None):
        """
        Trace ancestry for an entity using the unified ancestry graph builder.
        """
        if tenant_id is None:
            raise ValueError("tenant_id is required for ancestry tracing")
            
        # 创建单个节点的输入数据
        # 首先获取实体信息
        entity = None
        if entity_type == "Line":
            entity = self.db.query(Line).filter(Line.id == entity_id, Line.tenant_id == tenant_id).first()
        elif entity_type == "Task":
            entity = self.db.query(Task).filter(Task.id == entity_id, Task.tenant_id == tenant_id).first()
        elif entity_type == "Note":
            entity = self.db.query(Note).filter(Note.id == entity_id, Note.tenant_id == tenant_id).first()
        elif entity_type == "Schedule":
            entity = self.db.query(Schedule).filter(Schedule.id == entity_id, Schedule.tenant_id == tenant_id).first()
        elif entity_type == "Reminder":
            entity = self.db.query(Reminder).filter(Reminder.id == entity_id, Reminder.tenant_id == tenant_id).first()
        elif entity_type == "Segment":
            entity = self.db.query(Segment).filter(Segment.id == entity_id, Segment.tenant_id == tenant_id).first()
        elif entity_type == "Conversation":
            entity = self.db.query(Conversation).filter(Conversation.id == entity_id, Conversation.tenant_id == tenant_id).first()
        
        if not entity:
            summary = f"Could not find {entity_type} {entity_id}."
            return {
                "success": False,
                "summary": summary,
                "ancestry_graphs": [],
                "stats": {"calendar": 0, "tasks": 0, "notes": 0, "schedules": 0}
            }

        # 构建输入节点格式
        item_dict = {c.name: getattr(entity, c.name) for c in entity.__table__.columns}
        
        # Handle different entity types with different field names
        if entity_type == "Line":
            title = item_dict.get('text', '')[:100] + '...' if len(item_dict.get('text', '')) > 100 else item_dict.get('text', f"Line {entity.id}")
            summary = item_dict.get('text', '')
            date_field = item_dict.get('started_at') or item_dict.get('created_at')
        else:
            title = item_dict.get('title') or item_dict.get('content') or item_dict.get('summary') or f"{entity_type} {entity.id}"
            summary = item_dict.get('summary') or item_dict.get('content', '')
            date_field = item_dict.get('start_time') or item_dict.get('created_at') or item_dict.get('scheduled_time')
        
        input_node = {
            "id": f"n{entity_type}_{entity.id}",
            "type": entity_type,
            "title": title,
            "date": self._format_date(date_field),
            "summary": summary,
            "data": item_dict
        }
        
        # 使用统一的回溯图构建方法
        ancestry_graphs = self.build_complete_ancestry_graph([input_node], tenant_id)
        
        # 从ancestry graph中提取所有节点和边（对于单个节点）
        all_nodes = []
        all_edges = []
        
        if ancestry_graphs:
            graph = ancestry_graphs[0]  # 单个节点的图
            
            # 添加原始节点
            all_nodes.append(graph["source_node"])
            
            # 添加祖先路径中的节点
            all_nodes.extend(graph["ancestry_path"])
            
            # 添加路径边
            all_edges.extend(graph["path_edges"])
            
            # 添加相关segment的节点和边
            for rel_seg in graph["related_segments"]:
                all_nodes.append(rel_seg["node"])
                all_edges.append(rel_seg["relationship"])

        # Extract todos from nodes
        todos = []
        for node in all_nodes:
            if node["type"].lower() == 'task':
                todo_item = {
                    "id": node["data"].get('id', node["id"]),
                    "title": node["title"],
                    "priority": node["data"].get('priority', 'medium'),
                    "category": node["data"].get('category', 'General')
                }
                todos.append(todo_item)

        # Generate stats by entity types
        conversation_count = len([n for n in all_nodes if n["type"].lower() == 'conversation'])
        segment_count = len([n for n in all_nodes if n["type"].lower() == 'segment'])
        task_count = len([n for n in all_nodes if n["type"].lower() == 'task'])
        note_count = len([n for n in all_nodes if n["type"].lower() == 'note'])
        schedule_count = len([n for n in all_nodes if n["type"].lower() in ['calendar', 'schedule']])
        reminder_count = len([n for n in all_nodes if n["type"].lower() == 'reminder'])
        line_count = len([n for n in all_nodes if n["type"].lower() == 'line'])
        
        stats = {
            "conversations": conversation_count,
            "segments": segment_count,
            "tasks": task_count,
            "notes": note_count,
            "schedules": schedule_count,
            "reminders": reminder_count,
            "lines": line_count
        }

        # Generate path summary and origin story for single entity ancestry
        ancestry_path = self._get_entity_ancestry_path(entity_id, entity_type, tenant_id)
        
        # 使用原有的路径摘要方法
        summary = self._generate_path_summary([item.__dict__ for item in ancestry_path], user_query)
        
        # If there's an ancestry graph, also generate origin story summary for the first graph
        detailed_summary = summary
        if ancestry_graphs and len(ancestry_graphs) > 0:
            graph = ancestry_graphs[0]
            detailed_summary = graph.get("path_summary", summary)

        return {
            "success": True,
            "summary": summary,
            "detailed_summary": detailed_summary,  # Add detailed origin story summary
            "ancestry_graphs": ancestry_graphs,
            "stats": stats,
            "chain_length": len(all_nodes)
        }


    def get_segment_ancestry_path(self, segment_id, tenant_id: int, max_depth=5):
        """Get the complete ancestry path for a segment using SQLAlchemy with tenant filtering."""
        if tenant_id is None:
            raise ValueError("tenant_id is required for segment ancestry path tracing")
            
        path = []
        segment = self.db.query(Segment).filter(
            Segment.id == segment_id, 
            Segment.tenant_id == tenant_id
        ).first()
        if not segment:
            return []
        
        path.append(segment)
        
        # Check if segment has a conversation relationship and if it belongs to the same tenant
        if segment.conversation:
            # Verify the conversation belongs to the same tenant
            if hasattr(segment.conversation, 'tenant_id') and segment.conversation.tenant_id == tenant_id:
                path.insert(0, segment.conversation)
            
        return path

    def build_complete_ancestry_graph(self, input_nodes, tenant_id: int):
        """
        统一的回溯图构建方法。
        输入：零散的节点（line, segment, task等）
        输出：一个列表，每个元素包含一个节点及其完整的祖先路径信息
        
        返回格式：
        [
            {
                "source_node": {...},  # 原始输入节点
                "ancestry_path": [...],  # 祖先路径节点列表
                "path_edges": [...],     # 路径中的边
                "related_segments": [...] # 相关的segment关系
            },
            ...
        ]
        """
        if tenant_id is None:
            raise ValueError("tenant_id is required for ancestry graph building")
            
        result_graphs = []
        
        # 为每个输入节点构建独立的祖先图
        for input_node in input_nodes:
            entity_id = input_node['data']['id']
            entity_type = input_node['type']
            
            # 获取该节点的完整祖先路径
            ancestry_path_items = self._get_entity_ancestry_path(entity_id, entity_type, tenant_id)
            
            if not ancestry_path_items:
                continue
                
            # 转换祖先路径为节点格式（排除原始节点，只包含祖先）
            ancestry_nodes = []
            path_edges = []
            node_map = {}
            
            # 只处理祖先节点，排除原始节点（列表的最后一个元素）
            # 现在路径是[Conversation, Segment, OriginalEntity]，所以祖先节点是除了最后一个
            ancestor_items = ancestry_path_items[:-1] if len(ancestry_path_items) > 1 else []
            
            for db_item in ancestor_items:
                element_id = f"{db_item.__class__.__name__}_{db_item.id}"
                item_dict = {c.name: getattr(db_item, c.name) for c in db_item.__table__.columns}
                
                # Handle different entity types with different field names
                item_type = db_item.__class__.__name__
                if item_type == "Line":
                    title = item_dict.get('text', '')[:100] + '...' if len(item_dict.get('text', '')) > 100 else item_dict.get('text', f"Line {db_item.id}")
                    summary = item_dict.get('text', '')
                    date_field = item_dict.get('started_at') or item_dict.get('created_at')
                else:
                    title = item_dict.get('title') or item_dict.get('content') or item_dict.get('summary') or f"{item_type} {db_item.id}"
                    summary = item_dict.get('summary') or item_dict.get('content', '')
                    date_field = item_dict.get('start_time') or item_dict.get('created_at') or item_dict.get('scheduled_time')
                
                node_data = {
                    "id": f"n{element_id}",
                    "type": item_type,
                    "title": title,
                    "date": self._format_date(date_field),
                    "summary": summary,
                    "data": item_dict
                }
                
                ancestry_nodes.append(node_data)
                node_map[element_id] = node_data
            
            # 构建祖先路径中的层级边（只在祖先节点之间）
            for i in range(len(ancestor_items) - 1):
                parent_item = ancestor_items[i]
                child_item = ancestor_items[i + 1]
                
                parent_element_id = f"{parent_item.__class__.__name__}_{parent_item.id}"
                child_element_id = f"{child_item.__class__.__name__}_{child_item.id}"
                
                if parent_element_id in node_map and child_element_id in node_map:
                    path_edges.append({
                        "from": node_map[parent_element_id]['id'],
                        "to": node_map[child_element_id]['id'],
                        "label": "CONTAINS"
                    })
            
            # 如果有祖先节点，添加从最接近的祖先到原始节点的边
            if ancestor_items and ancestry_path_items:
                closest_ancestor = ancestor_items[-1] if ancestor_items else None
                original_entity = ancestry_path_items[-1]
                
                if closest_ancestor:
                    closest_ancestor_element_id = f"{closest_ancestor.__class__.__name__}_{closest_ancestor.id}"
                    if closest_ancestor_element_id in node_map:
                        path_edges.append({
                            "from": node_map[closest_ancestor_element_id]['id'],
                            "to": input_node['id'],
                            "label": "CONTAINS"
                        })
            
            # 查找相关的segment关系（包括祖先和原始节点中的segments）
            related_segments = []
            segment_ids = []
            
            # 从祖先节点中收集segment IDs
            for item in ancestor_items:
                if isinstance(item, Segment):
                    segment_ids.append(item.id)
            
            # 从原始节点中收集segment ID（如果原始节点是segment或有segment_id）
            if input_node['type'] == 'Segment':
                segment_ids.append(input_node['data']['id'])
            elif 'segment_id' in input_node['data'] and input_node['data']['segment_id']:
                segment_ids.append(input_node['data']['segment_id'])
            
            if segment_ids:
                relationships = crud_relationship.get_by_segment_ids(self.db, segment_ids_target=segment_ids, tenant_id=tenant_id)
                
                for rel in relationships:
                    # 添加相关segment节点（如果不在当前路径中）
                    segment_id_target = rel.segment_id_target if rel.segment_id_pointer in segment_ids else rel.segment_id_pointer
                    segment_id_pointer = rel.segment_id_pointer if rel.segment_id_pointer in segment_ids else rel.segment_id_target
                    
                    if segment_id_target != segment_id_pointer and segment_id_target not in segment_ids:
                        target_segment = self.db.query(Segment).filter(
                            Segment.id == segment_id_target,
                            Segment.tenant_id == tenant_id
                        ).first()
                        
                        if target_segment:
                            target_element_id = f"Segment_{target_segment.id}"
                            source_element_id = f"Segment_{segment_id_pointer}"
                            
                            item_dict = {c.name: getattr(target_segment, c.name) for c in target_segment.__table__.columns}
                            target_node_data = {
                                "id": f"n{target_element_id}",
                                "type": "Segment",
                                "title": item_dict.get('title') or item_dict.get('summary') or f"Segment {target_segment.id}",
                                "date": self._format_date(item_dict.get('start_time')),
                                "summary": item_dict.get('summary', ''),
                                "data": item_dict
                            }
                            
                            related_segments.append({
                                "node": target_node_data,
                                "relationship": {
                                    "from": node_map.get(source_element_id, {}).get('id'),
                                    "to": target_node_data['id'],
                                    "label": rel.type or "RELATED_TO"
                                }
                            })
            
            # Generate origin story summary for current path
            path_summary = self._generate_path_summary_for_entity(
                source_node=input_node,
                ancestry_path=ancestry_nodes,
                related_segments=related_segments,
                ancestry_path_items=ancestry_path_items
            )
            
            # 构建该节点的完整图信息
            node_graph = {
                "source_node": input_node,
                "ancestry_path": ancestry_nodes,
                "path_edges": path_edges,
                "related_segments": related_segments,
                "path_summary": path_summary  # 添加路径总结
            }
            
            result_graphs.append(node_graph)
        
        return result_graphs
    
    def build_single_node_ancestry_graph(self, entity_id, entity_type, tenant_id: int):
        """
        为单个节点构建独立的祖先图。
        输入：单个节点的ID和类型
        输出：该节点的完整祖先图，包括相关的segment关系
        """
        if tenant_id is None:
            raise ValueError("tenant_id is required for ancestry graph building")
            
        # 获取该节点的完整祖先路径
        ancestry_path = self._get_entity_ancestry_path(entity_id, entity_type, tenant_id)
        
        if not ancestry_path:
            return [], []
        
        nodes = []
        edges = []
        node_map = {}  # element_id -> node_data
        db_items_map = {}  # element_id -> db_object
        
        # 构建祖先路径中的所有节点
        for db_item in ancestry_path:
            element_id = f"{db_item.__class__.__name__}_{db_item.id}"
            
            # 创建节点数据
            item_dict = {c.name: getattr(db_item, c.name) for c in db_item.__table__.columns}
            
            # Handle different entity types with different field names
            item_type = db_item.__class__.__name__
            if item_type == "Line":
                title = item_dict.get('text', '')[:100] + '...' if len(item_dict.get('text', '')) > 100 else item_dict.get('text', f"Line {db_item.id}")
                summary = item_dict.get('text', '')
                date_field = item_dict.get('started_at') or item_dict.get('created_at')
            else:
                title = item_dict.get('title') or item_dict.get('content') or item_dict.get('summary') or f"{item_type} {db_item.id}"
                summary = item_dict.get('summary') or item_dict.get('content', '')
                date_field = item_dict.get('start_time') or item_dict.get('created_at') or item_dict.get('scheduled_time')
            
            node_data = {
                "id": f"n{element_id}",
                "type": item_type,
                "title": title,
                "date": self._format_date(date_field),
                "summary": summary,
                "data": item_dict
            }
            
            nodes.append(node_data)
            node_map[element_id] = node_data
            db_items_map[element_id] = db_item
        
        # 构建祖先路径中的层级边
        for i in range(len(ancestry_path) - 1):
            parent_item = ancestry_path[i]
            child_item = ancestry_path[i + 1]
            
            parent_element_id = f"{parent_item.__class__.__name__}_{parent_item.id}"
            child_element_id = f"{child_item.__class__.__name__}_{child_item.id}"
            
            edges.append({
                "from": node_map[parent_element_id]['id'],
                "to": node_map[child_element_id]['id'],
                "label": "CONTAINS"
            })
        
        # 如果路径中包含segment，查找与其相关的其他segment
        segment_ids = [
            db_item.id for db_item in db_items_map.values() 
            if isinstance(db_item, Segment)
        ]
        
        if segment_ids:
            relationships = crud_relationship.get_by_segment_ids(self.db, segment_ids=segment_ids, tenant_id=tenant_id)
            
            # 添加相关的segment节点和边
            for rel in relationships:
                # 添加目标segment（如果不在当前图中）
                segment_id_target = rel.segment_id_target if rel.segment_id_pointer in segment_ids else rel.segment_id_pointer
                segment_id_pointer = rel.segment_id_pointer if rel.segment_id_pointer in segment_ids else rel.segment_id_target
                
                if segment_id_target != segment_id_pointer:  # 避免自环
                    target_element_id = f"Segment_{segment_id_target}"
                    source_element_id = f"Segment_{segment_id_pointer}"
                    
                    # 如果目标segment不在当前图中，添加它
                    if target_element_id not in node_map:
                        target_segment = self.db.query(Segment).filter(
                            Segment.id == segment_id_target,
                            Segment.tenant_id == tenant_id
                        ).first()
                        
                        if target_segment:
                            item_dict = {c.name: getattr(target_segment, c.name) for c in target_segment.__table__.columns}
                            target_node_data = {
                                "id": f"n{target_element_id}",
                                "type": "Segment",
                                "title": item_dict.get('title') or item_dict.get('summary') or f"Segment {target_segment.id}",
                                "date": self._format_date(item_dict.get('start_time')),
                                "summary": item_dict.get('summary', ''),
                                "data": item_dict
                            }
                            nodes.append(target_node_data)
                            node_map[target_element_id] = target_node_data
                            
                            # 添加关系边
                            if source_element_id in node_map:
                                edges.append({
                                    "from": node_map[source_element_id]['id'],
                                    "to": node_map[target_element_id]['id'],
                                    "label": rel.label or "RELATED_TO"
                                })
        
        return nodes, edges

    def _get_entity_ancestry_path(self, entity_id, entity_type, tenant_id: int):
        """
        获取单个实体的完整祖先路径，支持图结构
        返回：从最顶层祖先到该实体的路径列表
        """
        path = []

        # 根据实体类型查询数据库
        current_entity = None
        if entity_type == "Line":
            current_entity = self.db.query(Line).filter(Line.id == entity_id, Line.tenant_id == tenant_id).first()
        elif entity_type == "Task":
            current_entity = self.db.query(Task).filter(Task.id == entity_id, Task.tenant_id == tenant_id).first()
        elif entity_type == "Note":
            current_entity = self.db.query(Note).filter(Note.id == entity_id, Note.tenant_id == tenant_id).first()
        elif entity_type == "Schedule":
            current_entity = self.db.query(Schedule).filter(Schedule.id == entity_id, Schedule.tenant_id == tenant_id).first()
        elif entity_type == "Reminder":
            current_entity = self.db.query(Reminder).filter(Reminder.id == entity_id, Reminder.tenant_id == tenant_id).first()
        elif entity_type == "Segment":
            current_entity = self.db.query(Segment).filter(Segment.id == entity_id, Segment.tenant_id == tenant_id).first()
        elif entity_type == "Conversation":
            current_entity = self.db.query(Conversation).filter(Conversation.id == entity_id, Conversation.tenant_id == tenant_id).first()

        if not current_entity:
            return []

        # 从下往上构建完整的祖先路径
        visited = set()
        stack = [current_entity]

        while stack:
            entity = stack.pop()
            if entity.id in visited:
                continue
            visited.add(entity.id)
            path.append(entity)

            # 获取直接相关的实体
            if isinstance(entity, Segment):
                # 从关系表中查找与当前 Segment 直接相关的其他 Segments
                relationships = crud_relationship.get_by_segment_ids(
                    self.db,
                    segment_ids_pointer=[],
                    segment_ids_target=[entity.id],
                    tenant_id=tenant_id
                )
                print(f"Found {len(relationships)} relationships for Segment {entity.id}")
                for rel in relationships:
                    # 确定相关的目标 Segment ID
                    segment_id_target = rel.segment_id_target

                    # 查询目标 Segment
                    related_segment = self.db.query(Segment).filter(
                        Segment.id == segment_id_target,
                        Segment.tenant_id == tenant_id
                    ).first()
                    print(f"Related Segment fetched: {related_segment}")
                    if related_segment:
                        stack.append(related_segment)

            # 获取父实体
            if hasattr(entity, 'segment_id') and entity.segment_id:
                parent_segment = self.db.query(Segment).filter(
                    Segment.id == entity.segment_id,
                    Segment.tenant_id == tenant_id
                ).first()
                if parent_segment:
                    stack.append(parent_segment)

            if hasattr(entity, 'conversation_id') and entity.conversation_id:
                parent_conversation = self.db.query(Conversation).filter(
                    Conversation.id == entity.conversation_id,
                    Conversation.tenant_id == tenant_id
                ).first()
                if parent_conversation:
                    stack.append(parent_conversation)

        # 反转列表，使得最顶层的实体在前面，原始实体在最后
        path.reverse()
        return path
    
    def _format_date(self, date_value):
        """格式化日期为字符串"""
        if date_value and hasattr(date_value, 'isoformat'):
            return date_value.isoformat()
        return None

    def _generate_path_summary(self, path_nodes, user_query=None):
        """
        Use LLM to summarize a path for UI/backend display. Converts non-serializable types for JSON.
        """
        def safe_json(obj):
            if isinstance(obj, dict):
                return {k: safe_json(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [safe_json(v) for v in obj]
            elif hasattr(obj, 'isoformat'):
                return obj.isoformat()
            elif type(obj).__name__ == 'DateTime':
                return str(obj)
            else:
                return obj
        path_nodes_safe = safe_json(path_nodes)
        
        # Include user query in the prompt if available
        query_context = f"\nUser Query Context: {user_query}\n" if user_query else "\n"
        
        # Extract key terms from user query for highlighting
        user_keywords = []
        if user_query:
            # Simple keyword extraction - split by spaces and filter common words
            stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'what', 'when', 'where', 'who', 'why', 'how'}
            words = [word.strip('.,!?;:"()[]').lower() for word in user_query.split()]
            user_keywords = [word for word in words if len(word) > 2 and word not in stop_words]
        
        keywords_instruction = ""
        if user_keywords:
            keywords_instruction = f"\nKeyword Highlighting: Use <mark style='background-color: #ffeb3b; color: #000;'>highlighted text</mark> to mark any mentions of these key terms from the user's query: {', '.join(user_keywords)}."
        
        prompt = (
            f"""Persona: You are an AI assistant specializing in narrative summarization for project management. Your task is to generate a concise "origin story" for a task or event with a strong emphasis on temporal flow.
    Context: You will receive a list of nodes representing a path, starting from conversations and ending with a specific action item (such as a Task, Schedule, or Note).{query_context}
    Critical Instructions:
    1. <b>Temporal Flow Priority</b>: START with the earliest time point and follow chronological order. Use connectors such as "Initially at [time]...", "Subsequently...", "This led to...", "Following the discussion...", "As a result of the [time] conversation...", and "Ultimately resulting in...".
    2. <b>Time Anchors</b>: Emphasize all temporal information using HTML bold formatting (e.g., <b>dates</b>, <b>times</b>, <b>sequences</b>, <b>duration</b>). Colors may be used for additional emphasis.
    3. <b>Chronological Causality</b>: Clearly illustrate how each preceding event caused the next, highlighting the cause-effect relationship in a time-based order.
    4. <b>User Query Relevance</b>: If a user query is provided, explain how this temporal sequence directly addresses their question.{keywords_instruction}
    5. <b>Highlight Critical Information</b>: Bold key action items, major decisions, all dates/times, locations, outcomes, and transitions using HTML tags.
    6. <b>Structured Narrative</b>: Format the narrative as "At [time X] → discussion on Y → led to [time Z] → action item created because...".
    7. <b>Output Format</b>: Provide a 2-4 sentence narrative that encapsulates the full chronological story from conversation to action. Output the summary as a valid HTML snippet (for example, wrapped in a <p> tag) without any headers or introductory text.
    Direct Output: Output ONLY the summary in the specified HTML format."""
            f"\n\nPath Data: {json.dumps(path_nodes_safe, ensure_ascii=False, indent=2)}"
        )

        print(f"Prompt for summarization: {prompt}")
        summary = chat_with_azure_openai(prompt, temperature=0.0)
        return summary
    
    def _generate_path_summary_for_entity(self, source_node, ancestry_path, related_segments, ancestry_path_items):
        """
        Generate origin story summary for a single entity
        
        Args:
            source_node: Source node (entity to summarize)
            ancestry_path: List of ancestor path nodes
            related_segments: List of related segment nodes
            ancestry_path_items: Database entities in ancestry path
        
        Returns:
            Plain text format summary containing origin story
        """
        try:
            # 构建总结所需的上下文信息
            context_info = {
                "entity": {
                    "type": source_node["type"],
                    "title": source_node["title"],
                    "summary": source_node["summary"],
                    "date": source_node["date"]
                },
                "ancestry": [],
                "related_segments": []
            }
            
            # 添加祖先路径信息（按时间顺序）
            for ancestor in ancestry_path:
                context_info["ancestry"].append({
                    "type": ancestor["type"],
                    "title": ancestor["title"],
                    "summary": ancestor["summary"],
                    "date": ancestor["date"]
                })
            
            # 添加相关segment信息
            for rel_seg in related_segments:
                context_info["related_segments"].append({
                    "title": rel_seg["node"]["title"],
                    "summary": rel_seg["node"]["summary"],
                    "date": rel_seg["node"]["date"],
                    "relationship": rel_seg["relationship"]["label"]
                })
            
            # 生成LLM prompt
            prompt = f"""
            You are an AI assistant specializing in analyzing event origins and relationships. Please generate a concise origin story summary based on the following information.

            **Target Entity Information:**
            - Type: {context_info['entity']['type']}
            - Title: {context_info['entity']['title']}
            - Content: {context_info['entity']['summary']}
            - Date: {context_info['entity']['date']}

            **Ancestry Path (from parent to child):**
            {json.dumps(context_info['ancestry'], ensure_ascii=False, indent=2)}

            **Related Events:**
            {json.dumps(context_info['related_segments'], ensure_ascii=False, indent=2)}

            **Requirements:**
            1. Generate a 2-4 sentence plain text summary explaining how this {context_info['entity']['type']} originated
            2. Focus on chronological order and causal relationships
            3. Emphasize key timing, decision points, and turning points
            4. Use natural language without any HTML formatting
            5. If information is insufficient, state "Based on current information, the specific origin of this {context_info['entity']['type']} is unclear"
            6. Output only the summary text without any additional explanation

            Direct output the plain text summary:
            """
            
            summary = chat_with_azure_openai(prompt, temperature=0.2,response_format={"type": "text"},system_content="")
            
            # Clean the returned content to ensure it's plain text
            summary = summary.strip()
            # Remove any possible HTML tags
            import re
            summary = re.sub(r'<[^>]+>', '', summary)
            
            return summary
            
        except Exception as e:
            print(f"Error generating path summary: {e}")
            return f"Error generating origin story for this {source_node['type']}."

