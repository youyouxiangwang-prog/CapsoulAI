from fastapi import UploadFile
import os
import uuid
from app.core.config import settings
from uuid import UUID
from pathlib import Path
import aiofiles

MIME_EXT = {
    "audio/webm": ".webm",
    "audio/webm;codecs=opus": ".webm",
    "audio/mp4": ".m4a",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/x-wav": ".wav",
    "audio/ogg": ".ogg",
}

class StorageService:
    """与存储交互"""
    def __init__(self):
        # 确保上传目录存在
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    async def save_file(self, file: UploadFile, tenant_id: str, file_id: str = None) -> dict:
        """
        保存上传文件到租户专属目录，返回路径/大小/类型等信息。
        file_id: 可选，指定文件名（如录音ID），否则自动生成。
        """
        # 自动推断扩展名
        ext = os.path.splitext(file.filename or "")[1].lower()
        if not ext:
            ext = MIME_EXT.get((file.content_type or "").lower(), ".webm")
        # 文件名
        filename = f"{file_id or uuid.uuid4()}{ext}"
        user_dir = os.path.join(settings.UPLOAD_DIR, str(tenant_id))
        os.makedirs(user_dir, exist_ok=True)
        file_path = os.path.join(user_dir, filename)
        size = 0
        async with aiofiles.open(file_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                await buffer.write(chunk)
        await file.close()
        return {
            "path": file_path,
            "filename": filename,
            "size": size,
            "content_type": file.content_type,
            "url": f"/uploads/{tenant_id}/{filename}"
        }
