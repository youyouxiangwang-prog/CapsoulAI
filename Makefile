# CapsoulAI 开发工具

.PHONY: help install init backend-dev backend-prod docker-build docker-run docker-dev docker-stop clean test celery-worker celery-beat redis format lint frontend-install frontend-build frontend-dev setup-venv

help:
	@echo "CapsoulAI 开发命令:"
	@echo "  make setup-venv  - 创建并设置虚拟环境"
	@echo "  make install     - 安装依赖"
	@echo "  make init        - 初始化项目（创建数据库等）"
	@echo "  make backend-dev - 启动后端开发服务器 (uvicorn --reload)"
	@echo "  make backend-prod - 启动后端生产服务器 (uvicorn)"
	@echo "  make frontend-install - 安装前端依赖 (npm install)"
	@echo "  make frontend-build   - 构建前端 (npm run build)"
	@echo "  make frontend-dev     - 启动前端开发服务器 (npm run dev)"
	@echo "  make docker-build - 构建Docker镜像"
	@echo "  make docker-run  - 运行Docker容器"
	@echo "  make docker-dev  - 使用Docker Compose启动开发环境"
	@echo "  make docker-stop - 停止Docker Compose服务"
	@echo "  make clean       - 清理临时文件"
	@echo "  make test        - 运行测试"
	@echo "  make celery-worker - 启动Celery Worker"
	@echo "  make celery-beat   - 启动Celery Beat"
	@echo "  make redis         - 启动Redis服务器"
	@echo "  make format        - 格式化代码"
	@echo "  make lint          - 代码检查"

setup-venv:
	@echo "创建并设置虚拟环境..."
	@if [ ! -d ".venv" ]; then \
		echo "创建虚拟环境..."; \
		python3 -m venv .venv; \
		echo "虚拟环境创建完成"; \
	else \
		echo "虚拟环境已存在"; \
	fi
	@echo "激活虚拟环境并更新pip..."
	@. .venv/bin/activate && pip install --upgrade pip
	@echo "虚拟环境设置完成，使用 'source .venv/bin/activate' 激活"

install: setup-venv
	@echo "安装Python依赖..."
	@. .venv/bin/activate && pip install -r requirements.txt

init:
	@echo "初始化项目..."
	python scripts/init_project.py

docker-build:
	@echo "构建Docker镜像..."
	docker build -t capsoulai-backend .

docker-run:
	@echo "运行Docker容器..."
	docker run -p 8091:8091 capsoulai-backend

docker-dev:
	@echo "使用Docker Compose启动开发环境..."
	docker-compose up -d

docker-stop:
	@echo "停止Docker Compose服务..."
	docker-compose down

clean:
	@echo "清理临时文件..."
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	rm -rf .pytest_cache
	rm -rf *.egg-info

test:
	@echo "运行测试..."
	# TODO: 添加测试命令
	@echo "测试功能待实现"

celery-worker:
	@echo "启动Celery Worker..."
	@echo "检查虚拟环境..."
	@if [ ! -d ".venv" ]; then \
		echo "创建虚拟环境..."; \
		python3 -m venv .venv; \
		echo "虚拟环境创建完成"; \
	fi
	@echo "激活虚拟环境并安装依赖..."
	@. .venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt
	@echo "启动Celery Worker..."
	@. .venv/bin/activate && celery -A app.workers.celery_app worker --loglevel=info

celery-beat:
	@echo "启动Celery Beat..."
	@echo "检查虚拟环境..."
	@if [ ! -d ".venv" ]; then \
		echo "创建虚拟环境..."; \
		python3 -m venv .venv; \
		echo "虚拟环境创建完成"; \
	fi
	@echo "激活虚拟环境并安装依赖..."
	@. .venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt
	@echo "启动Celery Beat..."
	@. .venv/bin/activate && celery -A app.workers.celery_app beat --loglevel=info

redis:
	@echo "启动Redis服务器..."
	redis-server

format:
	@echo "格式化代码..."
	black app/
	isort app/

lint:
	@echo "代码检查..."
	flake8 app/
	mypy app/

# 后端相关命令
backend-dev:
	@echo "启动后端开发服务器 (uvicorn --reload)..."
	@echo "检查虚拟环境..."
	@if [ ! -d ".venv" ]; then \
		echo "创建虚拟环境..."; \
		python3 -m venv .venv; \
		echo "虚拟环境创建完成"; \
	fi
	@echo "激活虚拟环境并安装依赖..."
	@. .venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt
	@echo "启动开发服务器..."
	if [ -f .env ]; then \
		echo "Using env: .env"; \
		set -a; . ./.env; set +a; \
	elif [ -f .env.example ]; then \
		echo "Using env: .env.example"; \
		set -a; . ./.env.example; set +a; \
	elif [ -f .env.development ]; then \
		echo "Using env: .env.development"; \
		set -a; . ./.env.development; set +a; \
	fi; \
	echo "VITE_API_PORT=$$VITE_API_PORT"; \
	. .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port "$${VITE_API_PORT:-8123}" --reload

backend-prod:
	@echo "启动后端生产服务器 (uvicorn)..."
	uvicorn app.main:app --host 0.0.0.0 --port 8000

backend:
	@echo "启动后端服务器..."
	@echo "检查虚拟环境..."
	@if [ ! -d ".venv" ]; then \
		echo "创建虚拟环境..."; \
		python3 -m venv .venv; \
		echo "虚拟环境创建完成"; \
	fi
	@echo "激活虚拟环境并安装依赖..."
	@. .venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt
	@echo "启动服务器..."
	if [ -f .env ]; then \
		echo "Using env: .env"; \
		set -a; . ./.env; set +a; \
	elif [ -f .env.example ]; then \
		echo "Using env: .env.example"; \
		set -a; . ./.env.example; set +a; \
	elif [ -f .env.development ]; then \
		echo "Using env: .env.development"; \
		set -a; . ./.env.development; set +a; \
	fi; \
	. .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port "$${VITE_API_PORT:-8000}" --reload

# 前端相关命令
frontend-install:
	@echo "安装前端依赖..."
	cd frontend && npm install

frontend-build:
	@echo "构建前端..."
	cd frontend && npm run build

frontend-dev:
	@echo "启动前端开发服务器..."
	@cd frontend && \
	if [ -f ../.env ]; then \
		echo "Using env: ../.env"; \
		set -a; . ../.env; set +a; \
	elif [ -f ../.env.example ]; then \
		echo "Using env: ../.env.example"; \
		set -a; . ../.env.example; set +a; \
	elif [ -f ../.env.development ]; then \
		echo "Using env: ../.env.development"; \
		set -a; . ../.env.development; set +a; \
	fi; \
	echo "VITE_API_PORT from shell: $$VITE_API_PORT"; \
	VITE_PORT="$${VITE_PORT:-80}" npm run dev -- --port $${VITE_PORT:-80} --no-open

celery:
	@echo "启动Celery Worker..."
	@echo "检查虚拟环境..."
	@if [ ! -d ".venv" ]; then \
		echo "创建虚拟环境..."; \
		python3 -m venv .venv; \
		echo "虚拟环境创建完成"; \
	fi
	@echo "激活虚拟环境并安装依赖..."
	@. .venv/bin/activate && pip install --upgrade pip && pip install -r requirements.txt
	@echo "启动Celery Worker..."
	if [ -f .env ]; then \
		echo "Using env: .env"; \
		set -a; . ./.env; set +a; \
	elif [ -f .env.example ]; then \
		echo "Using env: .env.example"; \
		set -a; . ./.env.example; set +a; \
	elif [ -f .env.development ]; then \
		echo "Using env: .env.development"; \
		set -a; . ./.env.development; set +a; \
	fi; \
	. .venv/bin/activate && celery -A app.workers.celery_app worker --loglevel=info --hostname="$${CELERY_WORKER_NAME:-default}"

# Docker 开发环境命令
docker-dev-build:
	@echo "构建开发环境Docker镜像..."
	docker-compose -f docker-compose.dev.yml build

docker-dev-up:
	@echo "启动开发环境Docker服务..."
	docker-compose -f docker-compose.dev.yml up -d

docker-dev-down:
	@echo "停止开发环境Docker服务..."
	docker-compose -f docker-compose.dev.yml down

docker-dev-logs:
	@echo "查看开发环境日志..."
	docker-compose -f docker-compose.dev.yml logs -f

# Docker 生产环境命令
docker-prod-build:
	@echo "构建生产环境Docker镜像..."
	docker-compose -f docker-compose.prod.yml build

docker-prod-up:
	@echo "启动生产环境Docker服务..."
	docker-compose -f docker-compose.prod.yml up -d

docker-prod-down:
	@echo "停止生产环境Docker服务..."
	docker-compose -f docker-compose.prod.yml down

docker-prod-logs:
	@echo "查看生产环境日志..."
	docker-compose -f docker-compose.prod.yml logs -f

# Docker 通用命令
docker-clean:
	@echo "清理Docker资源..."
	docker system prune -f
	docker volume prune -f

docker-reset:
	@echo "重置所有Docker环境..."
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose -f docker-compose.prod.yml down -v
	docker system prune -af
	docker volume prune -f

# AWS 部署相关
aws-login:
	@echo "登录AWS ECR..."
	aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ECR_REGISTRY}

aws-push:
	@echo "构建并推送到AWS ECR..."
	docker build -t capsoulai-backend:latest -f Dockerfile.prod .
	docker tag capsoulai-backend:latest ${AWS_ECR_REGISTRY}/capsoulai-backend:latest
	docker push ${AWS_ECR_REGISTRY}/capsoulai-backend:latest

aws-deploy: aws-login aws-push
	@echo "部署到AWS..."
	# 在EC2实例上运行
	docker-compose -f docker-compose.prod.yml pull
	docker-compose -f docker-compose.prod.yml up -d

# SSL证书生成 (用于开发测试)
ssl-generate:
	@echo "生成自签名SSL证书..."
	mkdir -p nginx/ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout nginx/ssl/key.pem \
		-out nginx/ssl/cert.pem \
		-subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

