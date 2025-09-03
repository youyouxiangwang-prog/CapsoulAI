# CapsoulAI 生产环境部署指南

## 部署前准备

### 1. 服务器环境要求
- Docker 和 Docker Compose
- 至少 4GB RAM，20GB 硬盘空间
- 端口 80, 443 (如果使用HTTPS), 8000 开放

### 2. 获取服务器IP
```bash
curl ifconfig.me  # 获取公网IP
```

### 3. 配置环境变量
```bash
# 复制配置模板
cp .env.prod.example .env.prod

# 编辑配置文件
nano .env.prod
```

**必须修改的配置项：**
- `SERVER_IP`: 设置为您的服务器公网IP
- `DOMAIN`: 如果有域名，设置为您的域名
- `ENABLE_HTTPS`: 如果配置了SSL证书，设置为 `true`

**可选配置：**
- 端口设置 (默认：前端80，后端8000)
- SSL证书路径 (如果启用HTTPS)

## 快速部署

### 1. 一键部署
```bash
./deploy.prod.sh
```

脚本会自动：
- 生成安全的数据库和Redis密码
- 根据您的IP/域名更新CORS配置
- 构建和启动所有服务
- 运行数据库迁移
- 生成访问凭据

### 2. 部署完成后
- 查看访问地址和凭据：`cat credentials_production.txt`
- 检查服务状态：`docker-compose -f docker-compose.prod.yml ps`
- 查看日志：`docker-compose -f docker-compose.prod.yml logs -f`

## 服务管理

### 基本操作
```bash
# 停止服务
docker-compose -f docker-compose.prod.yml down

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f postgres
docker-compose -f docker-compose.prod.yml logs -f redis
```

### 数据库操作
```bash
# 进入数据库容器
docker exec -it capsoulai-postgres-prod psql -U capsoulai_prod_user -d capsoulai_prod

# 运行数据库迁移
docker exec capsoulai-web-prod alembic upgrade head

# 数据库备份
docker exec capsoulai-postgres-prod pg_dump -U capsoulai_prod_user capsoulai_prod > backup.sql
```

## SSL/HTTPS 配置

### 快速设置 (推荐)
使用提供的SSL设置脚本：
```bash
# 给脚本执行权限
chmod +x setup-ssl.sh

# 运行SSL设置脚本
./setup-ssl.sh yourdomain.com
```

脚本会引导您选择：
1. **Let's Encrypt 免费证书** (推荐生产环境)
2. **自签名证书** (测试环境)
3. **已有证书文件** (如云服务商提供的证书)

### 手动配置方法

#### 方法1: Let's Encrypt 免费证书 (推荐)
```bash
# 安装 certbot
sudo apt-get update
sudo apt-get install certbot

# 停止可能占用80端口的服务
sudo systemctl stop nginx 2>/dev/null || true
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# 获取SSL证书
sudo certbot certonly --standalone -d yourdomain.com

# 证书路径
# 证书: /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# 私钥: /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

在 `.env.prod` 中设置：
```bash
DOMAIN=yourdomain.com
ENABLE_HTTPS=true
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

设置自动续期：
```bash
# 添加到crontab
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

#### 方法2: 自签名证书 (测试用)
```bash
# 创建SSL目录
mkdir -p ssl

# 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem \
  -out ssl/cert.pem \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=CapsoulAI/CN=yourdomain.com"
```

在 `.env.prod` 中设置：
```bash
DOMAIN=yourdomain.com
ENABLE_HTTPS=true
SSL_CERT_PATH=/app/ssl/cert.pem
SSL_KEY_PATH=/app/ssl/key.pem
```

**注意**: 自签名证书会在浏览器中显示安全警告。

#### 方法3: 云服务商证书
1. 在阿里云/腾讯云/AWS等控制台申请免费SSL证书
2. 下载证书文件（通常包含 .crt 和 .key 文件）
3. 上传到服务器，例如 `/etc/ssl/certs/` 目录
4. 在 `.env.prod` 中设置证书路径

### SSL验证
```bash
# 检查证书有效期
openssl x509 -in /path/to/cert.pem -text -noout | grep "Not After"

# 测试SSL连接
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# 在线SSL检测
# 访问: https://www.ssllabs.com/ssltest/
```

## 故障排除

### 常见问题

**1. 服务无法启动**
```bash
# 检查日志
docker-compose -f docker-compose.prod.yml logs

# 检查端口占用
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :8000
```

**2. 数据库连接失败**
```bash
# 检查数据库状态
docker exec capsoulai-postgres-prod pg_isready -U capsoulai_prod_user

# 重启数据库
docker-compose -f docker-compose.prod.yml restart postgres
```

**3. 前端无法访问API**
- 检查 CORS 配置是否正确
- 确认防火墙是否开放了必要端口
- 验证 Nginx 配置是否正确

**4. SSL证书问题**
```bash
# 检查证书有效期
openssl x509 -in /path/to/cert.pem -text -noout

# 测试SSL配置
openssl s_client -connect yourdomain.com:443
```

### 性能监控
```bash
# 查看容器资源使用
docker stats

# 查看系统资源
htop
df -h
```

## 安全建议

1. **定期更新密码**：定期重新生成数据库和Redis密码
2. **备份策略**：设置自动备份数据库和上传文件
3. **监控告警**：配置服务监控和告警系统
4. **访问限制**：使用防火墙限制不必要的端口访问
5. **SSL证书**：生产环境务必启用HTTPS
6. **日志管理**：定期清理和归档日志文件

## 支持

如果遇到问题，请检查：
1. `credentials_production.txt` - 包含所有访问信息
2. Docker容器日志
3. 系统资源使用情况
4. 网络和防火墙配置
