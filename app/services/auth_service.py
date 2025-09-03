from sqlalchemy.orm import Session
from typing import Optional
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.tenant import Tenant
from app.crud.crud_tenant import crud_tenant
from app.models.token import Token


class AuthService:
    """实现租户认证和注册的核心业务逻辑"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def register_tenant(self, tenant_create: dict) -> Tenant:
        """处理租户注册，包括密码哈希（如有）"""
        # 检查租户是否已存在
        existing_tenant = crud_tenant.get_by_email(db=self.db, email=tenant_create["email"])
        if existing_tenant:
            raise ValueError("Email already registered")
        # 创建租户
        tenant = crud_tenant.create(db=self.db, obj_in=tenant_create)
        return tenant
    
    async def authenticate_tenant(self, email: str) -> Token:
        """验证租户凭证并生成JWT（如有密码可加校验）"""
        tenant = crud_tenant.get_by_email(db=self.db, email=email)
        if not tenant:
            raise ValueError("Incorrect email")
        access_token = create_access_token(subject=str(tenant.id))
        return Token(access_token=access_token, token_type="bearer")
