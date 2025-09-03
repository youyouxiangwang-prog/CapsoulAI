#!/usr/bin/env python3
"""
PostgreSQL数据库初始化脚本
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

def create_database_if_not_exists():
    """创建数据库（如果不存在）"""
    print("检查并创建数据库...")
    
    try:
        # 连接到PostgreSQL服务器（不指定数据库）
        conn = psycopg2.connect(
            host=settings.POSTGRES_SERVER,
            port=settings.POSTGRES_PORT,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            database='postgres'  # 连接到默认数据库
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # 检查数据库是否存在
        cursor.execute(
            "SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s",
            (settings.POSTGRES_DB,)
        )
        exists = cursor.fetchone()
        
        if not exists:
            # 创建数据库
            cursor.execute(f'CREATE DATABASE "{settings.POSTGRES_DB}"')
            print(f"✅ 数据库 '{settings.POSTGRES_DB}' 创建成功")
        else:
            print(f"ℹ️ 数据库 '{settings.POSTGRES_DB}' 已存在")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ 数据库创建失败: {e}")
        return False

def test_connection():
    """测试数据库连接"""
    print("测试数据库连接...")
    
    try:
        conn = psycopg2.connect(
            host=settings.POSTGRES_SERVER,
            port=settings.POSTGRES_PORT,
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            database=settings.POSTGRES_DB
        )
        cursor = conn.cursor()
        cursor.execute("SELECT version()")
        version = cursor.fetchone()
        print(f"✅ 数据库连接成功")
        print(f"PostgreSQL版本: {version[0]}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        return False

def main():
    """主函数"""
    print("🐘 PostgreSQL 数据库初始化")
    print("=" * 50)
    
    # 创建数据库
    if not create_database_if_not_exists():
        sys.exit(1)
    
    # 测试连接
    if not test_connection():
        sys.exit(1)
    
    print("=" * 50)
    print("✅ PostgreSQL 数据库初始化完成！")
    print(f"数据库URL: {settings.DATABASE_URL}")

if __name__ == "__main__":
    main()
