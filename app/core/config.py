from typing import List, Optional, Any
from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import os
env_file_path = os.getenv("ENV_FILE", ".env")

class Settings(BaseSettings):
    """应用配置设置"""

    # 项目信息
    PROJECT_NAME: str = "CapsoulAI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # 服务器配置
    HOST: str = "0.0.0.0"
    VITE_PORT: int = Field(5175, alias="VITE_PORT")
    PORT: int = Field(8000, alias="VITE_API_PORT")
    DEBUG: bool = True

    # 安全配置
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # 数据库配置
    DATABASE_URL: Optional[str] = None

    # PostgreSQL 特定配置
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "1234.com"
    POSTGRES_DB: str = "postgres"
    POSTGRES_PORT: int = 5434
    
    # 数据库连接池配置
    DATABASE_POOL_SIZE: int = 10
    DATABASE_POOL_OVERFLOW: int = 20
    DATABASE_POOL_TIMEOUT: int = 30
    DATABASE_POOL_RECYCLE: int = 3600

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info) -> str:
        if isinstance(v, str) and v:
            return v
        # 如果用户没有提供DATABASE_URL，则使用其他字段的值（包括默认值）
        data = info.data
        user = data.get("POSTGRES_USER") or cls.__fields__["POSTGRES_USER"].default
        password = data.get("POSTGRES_PASSWORD") or cls.__fields__["POSTGRES_PASSWORD"].default
        server = data.get("POSTGRES_SERVER") or cls.__fields__["POSTGRES_SERVER"].default
        port = data.get("POSTGRES_PORT") or cls.__fields__["POSTGRES_PORT"].default
        db = data.get("POSTGRES_DB") or cls.__fields__["POSTGRES_DB"].default
        
        url = f"postgresql://{user}:{password}@{server}:{port}/{db}"
        print(url)
        return url
    # CORS 配置示例，允许通过服务器IP访问前端
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:5175"
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
                return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # 文件存储配置
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB

    # AI 服务配置
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_API_BASE: Optional[str] = None
    LLM_MODEL: str = "gpt-3.5-turbo"
    OPENAI_ORG_ID: Optional[str] = None
    OPENAI_TIMEOUT: int = 60

    # 语音转录服务配置
    ASR_SERVICE_URL: Optional[str] = None
    ASR_API_KEY: Optional[str] = None

    # Celery 配置
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # Azure OpenAI 配置
    AZURE_OPENAI_API_KEY: str = "34f12209d8bc40b092938b33a5b8275f"
    AZURE_OPENAI_ENDPOINT: str = "https://openaichatgpt-bsh.openai.azure.com/"
    AZURE_OPENAI_DEPLOYMENT: str = "gpt-4o"
    AZURE_OPENAI_API_VERSION: str = "2024-10-01-preview"

    # 分析相关配置
    ANALYSIS_MAX_INPUT_TOKEN: int = 12800
    ANALYSIS_TEMPERATURE: float = 0.2
    ANALYSIS_MAX_TOKENS: int = 4096
    ANALYSIS_MODEL_NAME: str = "gpt-3.5-turbo"

    # ✅ pydantic-settings v2 的写法
    model_config = SettingsConfigDict(
        env_file=env_file_path,  # Dynamically use the ENV_FILE_PATH
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",               # 忽略不在模型里的额外变量（如 VITE_*）
        populate_by_name=True,        # 允许用字段名或 alias 填充
    )

settings = Settings()
print(f"[CONFIG] CELERY_BROKER_URL: {settings.CELERY_BROKER_URL}")
print(f"[CONFIG] CELERY_RESULT_BACKEND: {settings.CELERY_RESULT_BACKEND}")
