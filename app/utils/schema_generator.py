import inspect
from sqlalchemy.orm import DeclarativeMeta
from sqlalchemy import Column
from app.schemas.base import Base

# 确保所有模型都被导入，以便注册到 Base.metadata
from app.schemas import (
    audio, conversation, item, line, note, relationship, reminder,
    schedule, segment, speaker, task, tenant, user_activity_log, voiceprint
)

def generate_schema_description() -> str:
    """
    从 SQLAlchemy 模型动态生成数据库 schema 的描述字符串。
    """
    schema_description = "## PostgreSQL Database Schema\n"
    schema_description += "Here are the relevant tables and their important columns for querying:\n"

    # 获取所有注册在 Base 下的模型
    # Use a more reliable way to get all mapped classes
    sorted_models = sorted(Base.registry.mappers, key=lambda m: m.class_.__tablename__)

    for mapper in sorted_models:
        cls = mapper.class_
        
        if not hasattr(cls, '__tablename__'):
            continue

        table_name = cls.__tablename__
        schema_description += f"\n- **{table_name}**:\n"
        
        if cls.__doc__:
            # Indent description properly
            schema_description += f"  - Description: {cls.__doc__.strip()}\n"

        # Add columns header
        schema_description += "  - Columns:\n"
        for column in cls.__table__.columns:
            # Indent columns properly
            col_info = f"    - `{column.name}` ({str(column.type)}"
            if column.primary_key:
                col_info += ", primary key"
            if column.foreign_keys:
                fk_info = ", ".join([f"fk to {fk.column.table.name}.{fk.column.name}" for fk in column.foreign_keys])
                col_info += f", {fk_info}"
            col_info += ")"
            
            # Use the comment field from the Column definition
            if column.comment:
                col_info += f": {column.comment}"

            schema_description += col_info + "\n"
            
    return schema_description

if __name__ == '__main__':
    # 使用示例:
    schema = generate_schema_description()
    print(schema)
