from fastapi import APIRouter
from app.api.v1.endpoints import auth, capture, plan, moment, utils

api_router = APIRouter()

# 包含各个模块的路由
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(capture.router, prefix="/capture", tags=["Audio Capture"])
api_router.include_router(plan.router, prefix="/plan", tags=["Planning"])
api_router.include_router(moment.router, prefix="/moment", tags=["Moments"])
api_router.include_router(utils.router, prefix="/utils", tags=["Utilities"])
