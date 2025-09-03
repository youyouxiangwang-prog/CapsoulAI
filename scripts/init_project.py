#!/usr/bin/env python3
"""
项目初始化脚本
用于创建数据库表和初始数据
"""

import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def init_database():
    """初始化数据库"""
    print("正在初始化数据库...")
    
    try:
        from app.core.database import create_tables
        create_tables()
        print("✅ 数据库表创建成功")
    except Exception as e:
        print(f"❌ 数据库初始化失败: {e}")
        return False
    
    return True

def create_sample_data():
    """创建示例数据"""
    print("正在创建示例数据...")
    
    try:
        from app.core.database import SessionLocal
        
        from app.core.security import get_password_hash
        
        db = SessionLocal()
        
        # 创建示例用户
        sample_user = {
            "email": "admin@capsoulai.com",
            "hashed_password": get_password_hash("admin123"),
            "is_active": True
        }
        
        existing_user = crud_user.get_by_email(db=db, email=sample_user["email"])
        if not existing_user:
            crud_user.create(db=db, obj_in=sample_user)
            print("✅ 示例用户创建成功")
        else:
            print("ℹ️ 示例用户已存在")
        
        db.close()
        
    except Exception as e:
        print(f"❌ 示例数据创建失败: {e}")
        return False
    
    return True

def main():
    """主函数"""
    print("🚀 CapsoulAI 项目初始化")
    print("=" * 50)
    
    # 初始化数据库
    if not init_database():
        sys.exit(1)
    
    # 创建示例数据
    if not create_sample_data():
        sys.exit(1)
    
    print("=" * 50)
    print("✅ 项目初始化完成！")
    print("\n启动命令:")
    print("  开发模式: python main.py")
    print("  生产模式: uvicorn app.main:app --host 0.0.0.0 --port 8091")
    print("  Docker: docker-compose up")
    print("\nAPI文档: http://localhost:8091/docs")

if __name__ == "__main__":
    main()
