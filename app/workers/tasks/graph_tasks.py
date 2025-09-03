import sys
import os
import json

# Add the parent directory to sys.path to resolve the module import issue
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils.openai_chat import chat_with_azure_openai
from sqlalchemy.orm import Session
from app.schemas.relationship import Relationship
from app.schemas.base import Base
from app.schemas import Segment
from app.workers.celery_app import celery_app
from app.core.database import SessionLocal
from app.crud.crud_relationship import crud_relationship

def get_isolated_segments(db: Session):
    """
    Query all Segment nodes that are not connected to any other Segment nodes.

    Args:
        db: SQLAlchemy session instance.

    Returns:
        List of isolated Segment objects.
    """
    isolated_segments = (
        db.query(Segment)
        .filter(~Segment.id.in_(
            db.query(Relationship.segment_id_pointer).union(
                db.query(Relationship.segment_id_target)
            )
        ))
        .all()
    )
    return isolated_segments

def parse_llm_response_with_relationship(response):
    """
    Parse the LLM response to extract related segment IDs with direction and relationship type.

    Args:
        response: The raw response from the LLM.

    Returns:
        A tuple containing a list of tuples (segment_id, direction) and the relationship type.
    """
    try:
        data = json.loads(response)
        related_segments_data = data.get("related_segments", [])
        relationship_type = data.get("relationship_type", None)

        # Convert to list of tuples (segment_id, direction)
        related_segments_with_direction = [
            (item["segment_id"], item["direction"])
            for item in related_segments_data
            if isinstance(item, dict) and "segment_id" in item and "direction" in item
        ]
        print(f"data: {data}, related_segments_with_direction: {related_segments_with_direction}, relationship_type: {relationship_type}")
        return related_segments_with_direction, relationship_type
    except json.JSONDecodeError:
        return [], None

def load_relationship_types():
    """
    Load relationship types from the event_relationship.json file.

    Returns:
        A list of relationship types.
    """
    # 使用绝对路径避免文件找不到的问题
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, "workers", "algos", "event_relationship.json")
    
    try:
        with open(file_path, "r") as file:
            data = json.load(file)
            return [rel["type"] for rel in data["relationship_definitions"]]
    except FileNotFoundError:
        print(f"Warning: Relationship types file not found at {file_path}")
        return ["FOLLOWS", "PRECEDES", "RELATED_TO"]  # 默认关系类型

def generate_llm_prompt(isolated, group):
    """
    Generate a prompt for the LLM to evaluate the relationship between an isolated segment and a group.

    Args:
        isolated: Dictionary containing all properties of the isolated Segment.
        group: List of Segment properties dictionaries in a group.

    Returns:
        A string prompt for the LLM.
    """
    # Load relationship types to include in the prompt
    relationship_types = load_relationship_types()
    
    # Ensure group is not None
    if group is None:
        group = []

    # Filter out None or invalid segment properties from the group
    valid_group = [seg for seg in group if seg]

    prompt = (
        f"Given the isolated segment with properties: {isolated} and the following group of segments with properties: {valid_group}, "
        "determine which segments in the group are related to the isolated segment. "
        f"You must use one of these valid relationship types: {relationship_types}. "
        "For each relationship, also specify the direction: 'outgoing' means the isolated segment points to the related segment, "
        "'incoming' means the related segment points to the isolated segment. "
        "Return your response as a JSON object with the following format: "
        '{"related_segments": [{"segment_id": "id", "direction": "outgoing|incoming"}], "relationship_type": "one_of_the_valid_types"}. '
        "If no relationships are found, return an empty list for related_segments and null for relationship_type."
    )
    # print("Generated LLM prompt:", prompt)
    return prompt

def match_isolated_with_groups(db: Session, unanalysed_segments, groups):
    """
    Use a large language model to determine relationships between unanalysed segments and existing groups.

    Args:
        db: SQLAlchemy session instance。
        unanalysed_segments: List of unanalysed Segment objects。
        groups: List of existing groups (each group is a set of segment IDs)。

    Returns:
        A list of relationships to be written to the database。
    """
    relationships = []
    segments_to_update = []  # 收集需要更新的segment IDs

    for segment in unanalysed_segments:
        segments_to_update.append(segment["id"])
        
        if not groups:
            groups.append([segment])
            continue
            
        matched = False
        for group in groups:
            # Generate a prompt for the LLM
            prompt = generate_llm_prompt(segment, group)
            response = chat_with_azure_openai(prompt)
            print(f"LLM response for segment {segment['id']}: {response}")
            # Parse the LLM response to extract relationships
            related_segments_with_direction, relationship_type = parse_llm_response_with_relationship(response)
            if not related_segments_with_direction or not relationship_type:
                continue
            # Create relationships based on the LLM response
            for segment_id_target, direction in related_segments_with_direction:
                # 修复: 确保ID类型一致
                try:
                    target_id = int(segment_id_target) if isinstance(segment_id_target, str) else segment_id_target
                except (ValueError, TypeError):
                    print(f"Warning: Invalid segment_id_target: {segment_id_target}")
                    continue
                    
                relationship_data = {
                    "tenant_id": segment["tenant_id"],
                    "segment_id_pointer": segment["id"] if direction == "outgoing" else target_id,
                    "segment_id_target": target_id if direction == "outgoing" else segment["id"],
                    "type": relationship_type
                }
                relationships.append(relationship_data)
            group.append(segment)
            matched = True
            break
        if not matched:
            groups.append([segment])
    
    # 批量更新segment状态，提高性能
    if segments_to_update:
        db.query(Segment).filter(Segment.id.in_(segments_to_update)).update(
            {"is_relationship_analyzed": True}, synchronize_session=False
        )
        db.commit()
    
    return relationships, groups

def find_groups_from_relationships(relationships, all_segments):
    """
    根据 relationships 将所有关联的 segments 分组。

    Args:
        relationships: List of Relationship objects。
        all_segments: List of all Segment objects。

    Returns:
        List of groups，每个 group 是一个包含 Segment 对象的集合。
    """
    from collections import defaultdict

    # 构建邻接表
    adjacency_list = defaultdict(set)
    for relationship in relationships:
        adjacency_list[relationship.segment_id_pointer].add(relationship.segment_id_target)
        adjacency_list[relationship.segment_id_target].add(relationship.segment_id_pointer)

    # 递归查找所有关联的 segments
    def dfs(segment, visited, group):
        if segment['id'] in visited:
            return
        visited.add(segment['id'])
        group.append(segment)
        for neighbor_id in adjacency_list[segment['id']]:
            # 修复: 添加异常处理避免StopIteration
            try:
                neighbor = next(seg for seg in all_segments if seg['id'] == neighbor_id)
                dfs(neighbor, visited, group)
            except StopIteration:
                print(f"Warning: Neighbor segment {neighbor_id} not found in all_segments")
                continue

    visited = set()
    groups = []

    for segment in all_segments:
        if segment['id'] not in visited:
            group = []
            dfs(segment, visited, group)
            groups.append(group)

    return groups

def segment_to_dict(segment):
    """
    Convert a Segment object to a dictionary.

    Args:
        segment: Segment object.

    Returns:
        A dictionary representation of the Segment object.
    """
    return {
        "id": segment.id,
        "tenant_id": segment.tenant_id,
        "conversation_id": segment.conversation_id,
        "started_at": segment.started_at,
        "ended_at": segment.ended_at,
        "hashtags": segment.hashtags,
        "main_topic": segment.main_topic,
        "name_of_context": segment.name_of_context,
        "speaker_role": segment.speaker_role,
        "subcategory": segment.subcategory,
        "summary": segment.summary,
        "title": segment.title,
        "created_at": segment.created_at,
        "is_relationship_analyzed": segment.is_relationship_analyzed
    }

@celery_app.task
def process_graph(tenant_id: str):
    """
    Celery task to process graph-related tasks。
    """
    db = SessionLocal()
    try:
        # 查询 is_relationship_analyzed == false 的 segments
        unanalysed_segments = db.query(Segment).filter(
            Segment.tenant_id == tenant_id,
            Segment.is_relationship_analyzed == False
        ).all()
        # Convert unanalysed_segments to JSON/dict format
        unanalysed_segments = [segment_to_dict(segment) for segment in unanalysed_segments]
        print(f"Found {len(unanalysed_segments)} unanalysed segments。")

        # 查询 is_relationship_analyzed == true 的 segments
        analysed_segments = db.query(Segment).filter(
            Segment.tenant_id == tenant_id,
            Segment.is_relationship_analyzed == True
        ).all()
        analysed_segments = [segment_to_dict(segment) for segment in analysed_segments]
        print(f"Found {len(analysed_segments)} analysed segments。")

        # 查询所有的 relationships
        existing_relationships = db.query(Relationship).filter(Relationship.tenant_id == tenant_id).all()
        print(f"Found {len(existing_relationships)} existing relationships。")

        # 根据 relationships 生成 groups
        groups = find_groups_from_relationships(existing_relationships, analysed_segments)
        print(f"Generated {len(groups)} groups from relationships。")
        for group in groups:
            print(f"Group has segment: {[segment['id'] for segment in group]}")

        # 将 analysed_segments 中没有 relationship 的 segment 单独分组
        analysed_without_relationship = [
            segment for segment in analysed_segments
            if segment["id"] not in {rel.segment_id_pointer for rel in existing_relationships} and
               segment["id"] not in {rel.segment_id_target for rel in existing_relationships}
        ]
        print(f"Found {len(analysed_without_relationship)} analysed segments without relationships。")

        for segment in analysed_without_relationship:
            groups.append([segment])

        # 输出每个 group 的信息
        for idx, group in enumerate(groups, start=1):
            print(f"Group {idx}: {group}")

        # 调用 match_isolated_with_groups 生成关系
        new_relationships, updated_groups = match_isolated_with_groups(db, unanalysed_segments, groups)

        # 写入到 relationships 表
        for relationship_data in new_relationships:
            crud_relationship.create(db, obj_in=relationship_data)

        print(f"Processed {len(new_relationships)} new relationships。")
        return {
            "status": "completed",
            "unanalysed_segments": len(unanalysed_segments),
            "analysed_segments": len(analysed_segments),
            "existing_relationships": len(existing_relationships),
            "new_relationships": len(new_relationships),
            "groups": len(groups),
            "updated_groups": len(updated_groups)
        }
    except Exception as e:
        print(f"Graph task processing failed: {str(e)}")
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()
