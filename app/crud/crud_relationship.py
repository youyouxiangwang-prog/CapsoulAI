from sqlalchemy.orm import Session
from typing import List, Optional, Any, Dict, Union
from app.schemas.relationship import Relationship

class CRUDRelationship:
    """封装对`relationships`表的操作"""
    
    def get(self, db: Session, id: int) -> Optional[Relationship]:
        """按ID查询"""
        return db.query(Relationship).filter(Relationship.id == id).first()
    
    def create(self, db: Session, *, obj_in: Union[Dict[str, Any], Any]) -> Relationship:
        """创建单条关系"""
        if isinstance(obj_in, dict):
            db_obj = Relationship(**obj_in)
        else:
            db_obj = Relationship(**obj_in.dict())
        
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
    
    def bulk_create(self, db: Session, *, relationships_data: List[Dict[str, Any]]) -> List[Relationship]:
        """批量创建关系 - 特有"""
        db_objs = [Relationship(**relationship_data) for relationship_data in relationships_data]
        
        db.add_all(db_objs)
        db.commit()
        
        for db_obj in db_objs:
            db.refresh(db_obj)
        
        return db_objs
    
    def get_by_source(
        self,
        db: Session,
        *,
        source_type: str,
        source_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Relationship]:
        """按源实体查询关系"""
        return (
            db.query(Relationship)
            .filter(
                Relationship.source_type == source_type,
                Relationship.source_id == source_id
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_by_target(
        self,
        db: Session,
        *,
        target_type: str,
        target_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Relationship]:
        """按目标实体查询关系"""
        return (
            db.query(Relationship)
            .filter(
                Relationship.target_type == target_type,
                Relationship.target_id == target_id
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_by_relation_type(
        self,
        db: Session,
        *,
        relation_type: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Relationship]:
        """按关系类型查询"""
        return (
            db.query(Relationship)
            .filter(Relationship.relation_type == relation_type)
            .offset(skip)
            .limit(limit)
            .all()
        )
    
    def get_relationships_between(
        self,
        db: Session,
        *,
        source_type: str,
        source_id: int,
        target_type: str,
        target_id: int
    ) -> List[Relationship]:
        """查询两个实体之间的所有关系"""
        return (
            db.query(Relationship)
            .filter(
                Relationship.source_type == source_type,
                Relationship.source_id == source_id,
                Relationship.target_type == target_type,
                Relationship.target_id == target_id
            )
            .all()
        )
    
    def get_by_segment_ids(
        self,
        db: Session,
        *,
        segment_ids_pointer: List[int] = [],
        segment_ids_target: List[int] = [],
        tenant_id: int
    ) -> List[Relationship]:
        """
        查询与给定分段ID列表相关的任何关系。
        - segment_ids_pointer: 查询 segment_id_pointer 为给定 ID 的关系。
        - segment_ids_target: 查询 segment_id_target 为给定 ID 的关系。
        """
        if not segment_ids_pointer and not segment_ids_target:
            return []

        query = db.query(Relationship).filter(Relationship.tenant_id == tenant_id)

        if segment_ids_pointer:
            query = query.filter(Relationship.segment_id_pointer.in_(segment_ids_pointer))

        if segment_ids_target:
            query = query.filter(Relationship.segment_id_target.in_(segment_ids_target))

        return query.all()

    def remove(self, db: Session, *, id: int) -> Optional[Relationship]:
        """删除关系"""
        obj = db.query(Relationship).get(id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj

crud_relationship = CRUDRelationship()
