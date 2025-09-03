# CapsoulAI 项目说明

CapsoulAI 是一个包含 FastAPI 后端与现代 React 前端的智能应用项目，支持本地开发、环境变量统一管理、Docker 部署。

## 功能特性

- ✅ FastAPI框架，自动生成API文档
- ✅ CORS支持，允许跨域请求
- ✅ RESTful API设计
- ✅ Pydantic数据验证
- ✅ 健康检查端点
- ✅ Docker容器化部署
- ✅ Docker Compose一键启动

## 快速开始

### 环境变量配置

所有端口、API 路径等统一在根目录 `.env.example` 配置，复制为 `.env` 或直接编辑：

```
VITE_PORT=5175
VITE_API_PORT=8123
VITE_API_PREFIX=/api/v1
BACKEND_CORS_ORIGINS='["http://localhost:5175","http://127.0.0.1:5175"]'
RECORDINGS_DIR=/home/lifeng/data/capsoul
```

**注意：更改后端端口后请让 @wang youxiang 将其添加至 Google cloud，否则无法通过 Google 登陆。**

### 本地开发

1. 安装依赖（自动创建虚拟环境）

   ```bash
   make install          # 创建虚拟环境并安装Python依赖
   make frontend-install # 安装前端依赖
   ```

2. 启动后端（自动激活虚拟环境）

   ```bash
   make backend-dev      # 自动创建/激活.venv，安装依赖，启动开发服务器
   ```

3. 启动前端

   ```bash
   make frontend-dev     # 启动前端开发服务器
   ```

4. 访问前端页面

   ```
   http://localhost:5175
   ```

### 其他常用命令

```bash
make setup-venv       # 仅创建虚拟环境（无需手动运行，其他命令会自动调用）
make celery          # 启动Celery Worker（自动处理虚拟环境）
make celery-worker   # 启动Celery Worker
make celery-beat     # 启动Celery Beat调度器
```

**注意**: 所有后端相关命令（`backend-dev`, `backend`, `celery` 等）都会自动：
- 检查并创建 `.venv` 虚拟环境（如果不存在）
- 激活虚拟环境
- 安装/更新依赖包
- 启动相应服务

### Docker 部署 (**还没调通**)

1. 构建镜像

   ```bash
   make docker-build
   ```

2. 启动服务

   ```bash
   make docker-dev
   ```

3. 停止服务

   ```bash
   make docker-stop
   ```
## 目录结构

```
CapsoulAI/
├── app/                # 后端主应用（FastAPI）
│   ├── api/            # API 路由
│   ├── configs/        # 配置文件
│   ├── core/           # 核心配置/工具
│   ├── crud/           # 数据访问层
│   ├── models/         # 数据模型
│   ├── schemas/        # Pydantic/SQLAlchemy schema
│   ├── services/       # 业务逻辑
│   ├── workers/        # 异步任务
│   ├── main.py         # 后端入口
│   └── alembic.ini     # 数据库迁移
├── frontend/           # 前端主应用（React + Vite）
│   ├── api/            # 前端 API 封装
│   ├── components/     # UI 组件
│   ├── hooks/          # React hooks
│   ├── pages/          # 页面
│   ├── utils/          # 工具函数
│   ├── main.jsx        # 前端入口
│   └── vite.config.js  # Vite 配置
├── scripts/            # 项目初始化/数据库脚本
├── .env.example        # 根目录环境变量示例（端口等统一配置）
├── .env.development    # 开发环境变量
├── requirements.txt    # Python 依赖
├── Dockerfile          # Docker 镜像构建
├── docker-compose.yml  # Docker Compose 配置
├── Makefile            # 一键开发命令
└── README.md           # 项目说明
```

## API端点

### 认证相关
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录

### 录音捕捉
- `POST /api/v1/capture/recordings` - 上传录音文件
- `GET /api/v1/capture/recordings` - 获取用户录音列表
- `GET /api/v1/capture/recordings/{id}` - 获取录音详情
- `GET /api/v1/capture/recordings/{id}/lines` - 获取转录文本
- `GET /api/v1/capture/search` - 基础搜索
- `GET /api/v1/capture/deep-search` - 深度搜索
- `GET /api/v1/capture/search-history` - 搜索历史

### 规划管理
- `POST /api/v1/plan/{item_type}` - 创建规划项
- `GET /api/v1/plan/{item_type}` - 获取规划项列表
- `PUT /api/v1/plan/{item_type}/{id}` - 更新规划项
- `PUT /api/v1/plan/{item_type}/{id}/status` - 更新状态

### 时刻分析
- `GET /api/v1/moment/filter` - 条件筛选
- `GET /api/v1/moment/recommended` - 获取推荐
- `POST /api/v1/moment/summary` - 生成总结

### 工具集成
- `GET /api/v1/utils/integrations/{provider}/connect` - 第三方授权
- `GET /api/v1/utils/integrations/{provider}/callback` - 授权回调
- `POST /api/v1/utils/speakers` - 创建说话人
- `POST /api/v1/utils/speakers/{id}/voiceprint` - 录入声纹
- `POST /api/v1/utils/export` - 导出数据

### 基础端点
- `GET /` - 根路径，返回API信息
- `GET /health` - 健康检查
- `GET /docs` - Swagger API文档
- `GET /redoc` - ReDoc API文档

## 更新的开发工作流

### 虚拟环境管理
- 使用 `make backend-dev` 或其他后端命令时，系统会自动：
  - 检查 `.venv` 虚拟环境是否存在
  - 如不存在则创建新的虚拟环境
  - 激活虚拟环境并更新pip
  - 安装 `requirements.txt` 中的依赖
- 手动创建虚拟环境：`make setup-venv`

### 环境配置
- 默认使用 `.env` 文件作为环境变量配置
- 系统会按优先级查找环境文件：`.env` → `.env.example` → `.env.development`
- 通过环境变量 `ENV_FILE` 可指定自定义配置文件

### 开发命令

#### 推荐的快速启动流程
```bash
# 1. 首次setup（会自动创建虚拟环境并安装依赖）
make install
make frontend-install

# 2. 启动后端（自动处理虚拟环境）
make backend-dev

# 3. 启动前端（新终端窗口）
make frontend-dev
```

#### 单独启动服务
- **后端开发服务器**：
  ```bash
  make backend-dev    # 开发模式，带热重载
  make backend        # 普通模式
  ```
- **前端开发服务器**：
  ```bash
  make frontend-dev   # 启动Vite开发服务器
  ```
- **Celery 异步任务**：
  ```bash
  make celery         # 启动Worker（推荐）
  make celery-worker  # 启动Worker
  make celery-beat    # 启动Beat调度器
  ```

### 环境变量支持
所有命令都会自动加载环境变量，无需手动激虚拟环境或设置环境变量。
