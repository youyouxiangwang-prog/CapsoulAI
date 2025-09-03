from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.api import api_router
from app.core.config import settings

def create_app() -> FastAPI:
    """创建FastAPI应用实例"""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="CapsoulAI - AI-powered conversation analysis platform",
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc"
    )

    # 添加CORS中间件
    allowed_origins = (
        [str(o).rstrip("/") for o in settings.BACKEND_CORS_ORIGINS]
        or [f"http://localhost:{settings.VITE_PORT}"]
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 包含API路由
    app.include_router(api_router, prefix=settings.API_V1_STR)

    return app

app = create_app()

# 静态托管前端页面
app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

@app.get("/")
async def root():
    """根路径健康检查"""
    return {
        "message": "Welcome to CapsoulAI API",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """健康检查端点"""
    return {"status": "healthy"}
