#!/usr/bin/env python3
"""
数据库管理脚本
提供数据库连接测试、初始化、重置等功能
"""
import sys
import os
import logging
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.core.config import settings
from app.core.database import engine, init_db, test_database_connection
import psycopg2
from psycopg2 import sql
from sqlalchemy import text

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_database_if_not_exists():
    """创建数据库（如果不存在）"""
    try:
        # 连接到PostgreSQL默认数据库
        conn_params = {
            'host': settings.POSTGRES_SERVER,
            'port': settings.POSTGRES_PORT,
            'user': settings.POSTGRES_USER,
            'password': settings.POSTGRES_PASSWORD,
            'database': 'postgres'  # 连接到默认数据库
        }
        
        logger.info("正在连接到PostgreSQL服务器...")
        conn = psycopg2.connect(**conn_params)
        conn.autocommit = True
        
        with conn.cursor() as cursor:
            # 检查数据库是否存在
            cursor.execute(
                "SELECT 1 FROM pg_database WHERE datname = %s",
                (settings.POSTGRES_DB,)
            )
            
            if not cursor.fetchone():
                # 创建数据库
                logger.info(f"正在创建数据库: {settings.POSTGRES_DB}")
                cursor.execute(
                    sql.SQL("CREATE DATABASE {}").format(
                        sql.Identifier(settings.POSTGRES_DB)
                    )
                )
                logger.info(f"数据库 {settings.POSTGRES_DB} 创建成功")
            else:
                logger.info(f"数据库 {settings.POSTGRES_DB} 已存在")
        
        conn.close()
        return True
        
    except Exception as e:
        logger.error(f"创建数据库失败: {e}")
        return False

def create_user_if_not_exists():
    """创建用户（如果不存在）"""
    try:
        # 连接到PostgreSQL默认数据库
        conn_params = {
            'host': settings.POSTGRES_SERVER,
            'port': settings.POSTGRES_PORT,
            'user': 'postgres',  # 使用postgres超级用户
            'password': 'postgres',  # 默认密码，生产环境需要修改
            'database': 'postgres'
        }
        
        logger.info("正在连接到PostgreSQL服务器创建用户...")
        conn = psycopg2.connect(**conn_params)
        conn.autocommit = True
        
        with conn.cursor() as cursor:
            # 检查用户是否存在
            cursor.execute(
                "SELECT 1 FROM pg_user WHERE usename = %s",
                (settings.POSTGRES_USER,)
            )
            
            if not cursor.fetchone():
                # 创建用户
                logger.info(f"正在创建用户: {settings.POSTGRES_USER}")
                cursor.execute(
                    sql.SQL("CREATE USER {} WITH PASSWORD %s").format(
                        sql.Identifier(settings.POSTGRES_USER)
                    ),
                    (settings.POSTGRES_PASSWORD,)
                )
                
                # 授予数据库权限
                cursor.execute(
                    sql.SQL("GRANT ALL PRIVILEGES ON DATABASE {} TO {}").format(
                        sql.Identifier(settings.POSTGRES_DB),
                        sql.Identifier(settings.POSTGRES_USER)
                    )
                )
                logger.info(f"用户 {settings.POSTGRES_USER} 创建成功并授权")
            else:
                logger.info(f"用户 {settings.POSTGRES_USER} 已存在")
        
        conn.close()
        return True
        
    except Exception as e:
        logger.warning(f"创建用户失败（可能需要PostgreSQL超级用户权限）: {e}")
        return False

def install_extensions():
    """安装PostgreSQL扩展"""
    try:
        with engine.connect() as connection:
            # 安装常用扩展
            extensions = [
                'uuid-ossp',  # UUID生成
                'pg_trgm',    # 模糊匹配
                'btree_gin',  # GIN索引支持
            ]
            
            for ext in extensions:
                try:
                    connection.execute(text(f"CREATE EXTENSION IF NOT EXISTS \"{ext}\""))
                    logger.info(f"扩展 {ext} 安装成功")
                except Exception as e:
                    logger.warning(f"扩展 {ext} 安装失败: {e}")
            
            connection.commit()
            
    except Exception as e:
        logger.error(f"安装扩展失败: {e}")

def drop_all_tables():
    """删除所有表"""
    try:
        with engine.connect() as connection:
            # 获取所有表名
            result = connection.execute(text("""
                SELECT tablename FROM pg_tables 
                WHERE schemaname = 'public'
            """))
            
            tables = [row[0] for row in result.fetchall()]
            
            if tables:
                logger.info(f"正在删除 {len(tables)} 个表...")
                # 禁用外键约束检查
                connection.execute(text("SET session_replication_role = replica"))
                
                # 删除所有表
                for table in tables:
                    connection.execute(text(f'DROP TABLE IF EXISTS "{table}" CASCADE'))
                
                # 恢复外键约束检查
                connection.execute(text("SET session_replication_role = DEFAULT"))
                connection.commit()
                logger.info("所有表删除成功")
            else:
                logger.info("没有找到需要删除的表")
                
    except Exception as e:
        logger.error(f"删除表失败: {e}")
        raise

def reset_database():
    """重置数据库"""
    try:
        logger.info("开始重置数据库...")
        
        # 删除所有表
        drop_all_tables()
        
        # 重新创建表
        init_db()
        
        # 安装扩展
        install_extensions()
        
        logger.info("数据库重置完成")
        
    except Exception as e:
        logger.error(f"数据库重置失败: {e}")
        raise

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='数据库管理工具')
    parser.add_argument('action', choices=[
        'test', 'init', 'reset', 'create-db', 'create-user', 'install-extensions'
    ], help='要执行的操作')
    
    args = parser.parse_args()
    
    try:
        if args.action == 'test':
            logger.info("测试数据库连接...")
            if test_database_connection():
                logger.info("✅ 数据库连接成功")
                sys.exit(0)
            else:
                logger.error("❌ 数据库连接失败")
                sys.exit(1)
                
        elif args.action == 'create-db':
            logger.info("创建数据库...")
            if create_database_if_not_exists():
                logger.info("✅ 数据库创建/检查完成")
            else:
                logger.error("❌ 数据库创建失败")
                sys.exit(1)
                
        elif args.action == 'create-user':
            logger.info("创建用户...")
            if create_user_if_not_exists():
                logger.info("✅ 用户创建/检查完成")
            else:
                logger.error("❌ 用户创建失败")
                
        elif args.action == 'install-extensions':
            logger.info("安装PostgreSQL扩展...")
            install_extensions()
            logger.info("✅ 扩展安装完成")
            
        elif args.action == 'init':
            logger.info("初始化数据库...")
            init_db()
            install_extensions()
            logger.info("✅ 数据库初始化完成")
            
        elif args.action == 'reset':
            logger.info("重置数据库...")
            reset_database()
            logger.info("✅ 数据库重置完成")
            
    except Exception as e:
        logger.error(f"❌ 操作失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
