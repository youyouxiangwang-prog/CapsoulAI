from sqlalchemy.ext.declarative import declarative_base
Base = declarative_base()

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# 创建数据库引擎
engine = create_engine(
    settings.DATABASE_URL,
    # PostgreSQL连接池配置
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_POOL_OVERFLOW,
    pool_timeout=settings.DATABASE_POOL_TIMEOUT,
    pool_recycle=settings.DATABASE_POOL_RECYCLE,
    pool_pre_ping=True,  # 启用连接检测
    # PostgreSQL特定配置
    echo=False,  # 开发环境显示SQL日志（使用INFO级别日志）
    # 连接参数
    connect_args={
        "options": "-c timezone=Asia/Shanghai",  # 设置时区
        "application_name": settings.PROJECT_NAME,  # 应用名称
        "connect_timeout": 10,  # 连接超时
    }
)

# 添加连接事件监听器
@event.listens_for(engine, "connect")
def set_postgresql_params(dbapi_connection, connection_record):
    """PostgreSQL连接建立时的回调"""
    try:
        with dbapi_connection.cursor() as cursor:
            # 设置一些PostgreSQL参数
            cursor.execute("SET timezone = 'Asia/Shanghai'")
            cursor.execute("SET statement_timeout = '60s'")
            logger.info("PostgreSQL连接已建立，已设置时区和超时参数")
    except Exception as e:
        logger.warning(f"设置PostgreSQL参数时出现警告: {e}")

# 创建会话工厂
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine,
    expire_on_commit=False  # 避免访问已提交对象时的懒加载问题
)

# 导入所有模型以确保它们被注册
from app.schemas.conversation import Conversation
from app.schemas.segment import Segment
from app.schemas.line import Line
from app.schemas.speaker import Speaker
from app.schemas.voiceprint import Voiceprint
from app.schemas.relationship import Relationship
from app.schemas.user_activity_log import UserActivityLog
from app.schemas.schedule import Schedule
from app.schemas.segment import Segment
from app.schemas.line import Line
from app.schemas.task import Task
from app.schemas.reminder import Reminder
from app.schemas.note import Note
from app.schemas.tenant import Tenant
from app.schemas.conversation import Conversation
from app.schemas.speaker import Speaker
from app.schemas.voiceprint import Voiceprint
from app.schemas.relationship import Relationship
from app.schemas.audio import Audio
from app.schemas.user_activity_log import UserActivityLog

def create_tables():
    """创建所有数据库表"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表创建成功")
    except Exception as e:
        logger.error(f"数据库表创建失败: {e}")
        raise

def get_db():
    """获取数据库会话的依赖函数"""
    db = SessionLocal()
    print("Database session created", db)
    try:
        yield db
    except Exception as e:
        logger.error(f"数据库会话错误: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def test_database_connection():
    """测试数据库连接"""
    try:
        # 测试连接
        with engine.connect() as connection:
            result = connection.execute("SELECT 1 as test")
            test_value = result.scalar()
            if test_value == 1:
                logger.info("数据库连接测试成功")
                return True
            else:
                logger.error("数据库连接测试失败")
                return False
    except Exception as e:
        logger.error(f"数据库连接测试异常: {e}")
        return False

def init_db():
    """初始化数据库"""
    try:
        # 测试连接
        if not test_database_connection():
            raise Exception("数据库连接失败，无法初始化")
        
        # 创建所有表
        create_tables()
        logger.info("数据库初始化成功")
    except Exception as e:
        logger.error(f"数据库初始化失败: {e}")
        raise
