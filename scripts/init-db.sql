-- 初始化CapsoulAI数据库

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 设置时区
SET timezone = 'UTC';

-- 创建索引（如果需要）
-- 这些索引将在Alembic迁移中创建，这里仅作为参考

-- 用户表索引
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(is_active);

-- 对话表索引
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_owner ON conversations(owner_id);
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_status ON conversations(transcription_status, analysis_status);

-- 全文搜索索引（用于搜索功能）
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lines_text_gin ON lines USING gin(to_tsvector('english', text));

-- 打印初始化完成信息
\echo 'Database initialization completed.'
