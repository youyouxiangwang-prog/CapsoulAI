# File: auth.py
# --- MODIFIED VERSION: google_callback now returns JSON ---

import os
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from fastapi.responses import RedirectResponse, JSONResponse

# --- These imports are now needed in google_callback ---
import requests
import json
from datetime import datetime

from app.api.deps import get_db, get_current_tenant
from app.models.token import Token
from app.services.auth_service import AuthService
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import create_access_token, create_refresh_token, verify_refresh_token
from app.crud.crud_tenant import crud_tenant
from app.schemas.tenant import Tenant, TenantRead

router = APIRouter()

# --- Functions register, login, test_redirect, google_login remain unchanged ---

@router.post("/register", response_model=TenantRead)
async def register(
    tenant_in: dict,
    db: Session = Depends(get_db)
):
    """注册新租户"""
    auth_service = AuthService(db)
    
    try:
        tenant = await auth_service.register_tenant(tenant_in)
        return TenantRead.from_orm(tenant)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """租户登录并获取访问令牌（如有密码）"""
    auth_service = AuthService(db)
    
    try:
        token = await auth_service.authenticate_tenant(email=form_data.username)
        tenant = crud_tenant.get_by_email(db, email=form_data.username)
        if tenant:
            rt = create_refresh_token(subject=str(tenant.id))
            resp = JSONResponse(content=token.model_dump() if hasattr(token, "model_dump") else token)
            resp.set_cookie(
                key="rt",
                value=rt,
                httponly=True,
                samesite="lax",
                secure=not settings.DEBUG,
                max_age=60 * 60 * 24 * settings.REFRESH_TOKEN_EXPIRE_DAYS,
                path="/",
            )
            return resp
        return token
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/test-redirect")
async def test_redirect():
    """一个超简单的测试接口，唯一的任务就是重定向回前端的一个测试页面。"""
    frontend_port = os.getenv("VITE_PORT", "5175")
    test_url = f"http://localhost:{frontend_port}/redirect-target-page"
    print(f"--- TEST: Attempting to redirect to: {test_url} ---")
    return RedirectResponse(url=test_url)

@router.get("/google/login")
async def google_login():
    """跳转到Google OAuth2授权页面"""
    client_id = "1016666660738-4q0tqnt46a9sga8jsrpudtmpltf7gqup.apps.googleusercontent.com"
    frontend_port = os.getenv("VITE_PORT", "5175")
    redirect_uri = f"http://localhost:{frontend_port}/auth/google/callback"
    print("[Google OAuth] Step: /google/login called")
    print(f"[Google OAuth] redirect_uri for Google: {redirect_uri}")
    scope = "openid email profile"
    state = "random_state_string"
    oauth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope={scope}&"
        f"state={state}"
    )
    print(f"[Google OAuth] Redirecting to: {oauth_url}")
    result = RedirectResponse(url=oauth_url)
    print("result:",result.status_code, result.headers)
    return result

# --- 【【 THIS IS THE MODIFIED FUNCTION 】】 ---
@router.get("/google/callback")
async def google_callback(code: str):
    """
    接收前端 fetch 传来的 code，处理认证，并返回包含 access_token 的 JSON。
    """
    client_id = "1016666660738-4q0tqnt46a9sga8jsrpudtmpltf7gqup.apps.googleusercontent.com"
    client_secret = "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"
    frontend_port = os.getenv("VITE_PORT", "5175")
    redirect_uri = f"http://localhost:{frontend_port}/auth/google/callback"

    # 1. 用code换取access_token
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code, "client_id": client_id, "client_secret": client_secret,
        "redirect_uri": redirect_uri, "grant_type": "authorization_code"
    }
    token_resp = requests.post(token_url, data=data)
    token_json = token_resp.json()

    access_token = token_json.get("access_token")
    if not access_token:
        error_detail = token_json.get("error_description", "Failed to exchange code for token.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_detail)

    # 2. 用access_token获取用户信息
    userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    headers = {"Authorization": f"Bearer {access_token}"}
    userinfo_resp = requests.get(userinfo_url, headers=headers)
    userinfo = userinfo_resp.json()

    # 3. 写入租户表
    email = userinfo.get("email")
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email not provided by Google.")
    
    name = userinfo.get("name")
    google_id = userinfo.get("id")
    db = SessionLocal()
    try:
        tenant = crud_tenant.get_by_email(db, email=email)
        if not tenant:
            tenant_data = {
                "name": name or email, "email": email, "google_id": google_id,
                "plan": "free", "status": "active", "settings": {},
                "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(),
                "last_login_at": datetime.utcnow()
            }
            tenant = crud_tenant.create(db, obj_in=tenant_data)
        else:
            update_data = {"google_id": google_id, "last_login_at": datetime.utcnow()}
            crud_tenant.update(db, db_obj=tenant, obj_in=update_data)
    finally:
        db.close()

    # 4. 用本地JWT生成token
    local_jwt = create_access_token(subject=str(tenant.id))
    refresh_jwt = create_refresh_token(subject=str(tenant.id))
    print(f"[Google OAuth] Tenant authenticated via API, returning JWT: {local_jwt}")

    # 5. 【核心修改】不再返回重定向，而是返回一个 JSON 响应！
    response = JSONResponse(content={
        "access_token": local_jwt,
        "token_type": "bearer"
    })
    
    # 仍然通过 cookie 来安全地设置 refresh_token
    response.set_cookie(
        key="rt",
        value=refresh_jwt,
        httponly=True,
        samesite="lax",
        secure=not settings.DEBUG,
        max_age=60 * 60 * 24 * settings.REFRESH_TOKEN_EXPIRE_DAYS,
        path="/",
    )
    return response

# --- Functions verify and refresh remain unchanged ---

@router.get("/verify")
async def verify_token(
    current_tenant = Depends(get_current_tenant)
):
    return {"valid": True, "user_id": current_tenant.id}

@router.post("/refresh")
async def refresh_access_token(request: Request, db: Session = Depends(get_db)):
    """用 HttpOnly Cookie 里的 refresh token 换新 access token（无感续期）"""
    rt = request.cookies.get("rt")
    if not rt:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token")
    user_id = verify_refresh_token(rt)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid/expired refresh token")

    tenant = crud_tenant.get_by_id(db, id=user_id)
    if not tenant or tenant.status != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive tenant")

    new_access = create_access_token(subject=str(user_id))
    new_rt = create_refresh_token(subject=str(user_id))
    resp = JSONResponse(content={"access_token": new_access, "token_type": "bearer"})
    resp.set_cookie(
        key="rt",
        value=new_rt,
        httponly=True,
        samesite="lax",
        secure=not settings.DEBUG,
        max_age=60 * 60 * 24 * settings.REFRESH_TOKEN_EXPIRE_DAYS,
        path="/",
    )
    return resp