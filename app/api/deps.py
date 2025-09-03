from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Generator
from app.core.security import verify_token
from app.crud.crud_tenant import crud_tenant



# 安全认证
security = HTTPBearer()

def get_db() -> Generator:
    """提供数据库会话"""
    from app.core.database import get_db as _get_db
    yield from _get_db()

def get_current_tenant(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """验证令牌并提供当前登录租户"""
    token = credentials.credentials
    tenant_id = verify_token(token)
    if tenant_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    tenant = crud_tenant.get_by_id(db=db, id=tenant_id)
    if tenant is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tenant not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if tenant.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive tenant"
        )
    return tenant
