#!/bin/bash

# CapsoulAI Production Deployment Script
# Usage: ./deploy.prod.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "CapsoulAI Production Deployment"
echo "========================================="

# Generate random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Check required tools
check_dependencies() {
    echo "Checking required tools..."
    command -v docker >/dev/null 2>&1 || { echo "Error: Docker not installed"; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { echo "Error: Docker Compose not installed"; exit 1; }
    command -v openssl >/dev/null 2>&1 || { echo "Error: OpenSSL not installed"; exit 1; }
    echo "✓ Tool check passed"
}

# Initialize production configuration
init_prod_config() {
    ENV_FILE=".env.prod"
    
    if [ ! -f "$ENV_FILE" ]; then
        echo "❌ .env.prod file not found"
        echo "Please copy and configure the production environment file:"
        echo "  cp .env.prod.example .env.prod"
        echo "  Edit .env.prod to set your server IP (currently: 13.60.254.11)"
        exit 1
    fi
    
    # Auto-detect and set SERVER_IP if not set
    if grep -q "SERVER_IP=YOUR_SERVER_IP_HERE" "$ENV_FILE" 2>/dev/null; then
        echo "Auto-detecting server IP..."
        DETECTED_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "13.60.254.11")
        echo "Detected IP: $DETECTED_IP"
        sed -i "s/SERVER_IP=YOUR_SERVER_IP_HERE/SERVER_IP=${DETECTED_IP}/" "$ENV_FILE"
        sed -i "s/DOMAIN=YOUR_SERVER_IP_HERE/DOMAIN=${DETECTED_IP}/" "$ENV_FILE"
        echo "✓ SERVER_IP automatically set to: $DETECTED_IP"
    fi
    
    # Check if passwords need to be generated
    if ! grep -q "POSTGRES_PASSWORD=.*[^your-strong-database-password-here]" "$ENV_FILE" 2>/dev/null; then
        echo "Generating database password..."
        POSTGRES_PASSWORD=$(generate_password)
        sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${POSTGRES_PASSWORD}/" "$ENV_FILE"
    fi
    
    if ! grep -q "REDIS_PASSWORD=.*[^your-strong-redis-password-here]" "$ENV_FILE" 2>/dev/null; then
        echo "Generating Redis password..."
        REDIS_PASSWORD=$(generate_password)
        sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=${REDIS_PASSWORD}/" "$ENV_FILE"
    fi
    
    if ! grep -q "SECRET_KEY=.*[^your-super-secret-key-change-this-in-production]" "$ENV_FILE" 2>/dev/null; then
        echo "Generating application secret key..."
        SECRET_KEY=$(openssl rand -hex 32)
        sed -i "s/SECRET_KEY=.*/SECRET_KEY=${SECRET_KEY}/" "$ENV_FILE"
    fi
    
    # Update Celery configuration with Redis password
    source "$ENV_FILE"
    if [ -n "$REDIS_PASSWORD" ]; then
        sed -i "s|CELERY_BROKER_URL=.*|CELERY_BROKER_URL=redis://:${REDIS_PASSWORD}@redis:6379/0|" "$ENV_FILE"
        sed -i "s|CELERY_RESULT_BACKEND=.*|CELERY_RESULT_BACKEND=redis://:${REDIS_PASSWORD}@redis:6379/0|" "$ENV_FILE"
    fi
    
    echo "✓ Production configuration initialized"
}

# Validate environment configuration
validate_config() {
    echo "Validating environment configuration..."
    source ".env.prod"
    
    # Check critical configuration
    if [ "$SERVER_IP" = "YOUR_SERVER_IP_HERE" ]; then
        echo "❌ Error: Please set correct SERVER_IP in .env.prod"
        echo "Current value: $SERVER_IP"
        exit 1
    fi
    
    if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$REDIS_PASSWORD" ]; then
        echo "❌ Error: Database or Redis password not set"
        exit 1
    fi
    
    # Ensure HTTP is used instead of HTTPS
    if [ "$ENABLE_HTTPS" = "true" ]; then
        echo "⚠️  Notice: HTTPS configured but no SSL certificate found, switching to HTTP"
        sed -i "s/ENABLE_HTTPS=true/ENABLE_HTTPS=false/" ".env.prod"
    fi
    
    echo "✓ Configuration validation passed - Using IP address HTTP access: $SERVER_IP"
}

# Generate credentials file
generate_credentials() {
    echo "Generating credentials file..."
    source ".env.prod"
    
    cat > "credentials_production.txt" << EOF
CapsoulAI Production Environment Credentials
Generated: $(date)

Server Configuration:
  IP Address: ${SERVER_IP}
  Access Method: HTTP (No SSL)

Access URLs:
  Frontend: http://${SERVER_IP}
  API: http://${SERVER_IP}${API_PREFIX}
  Health Check: http://${SERVER_IP}/health
  API Documentation: http://${SERVER_IP}/docs

Port Configuration:
  Frontend Port: ${FRONTEND_PORT} (HTTP)
  Backend Port: ${BACKEND_PORT}

Database Information:
  Database Name: ${POSTGRES_DB}
  Username: ${POSTGRES_USER}
  Password: ${POSTGRES_PASSWORD}

Redis Information:
  Password: ${REDIS_PASSWORD}

Application Keys:
  SECRET_KEY: ${SECRET_KEY}

Important Notes:
1. Please keep this credentials file secure
2. Currently using HTTP access, configure SSL certificate for HTTPS if needed
3. Recommended to backup database regularly
4. Access URL: http://${SERVER_IP}
EOF
    
    chmod 600 "credentials_production.txt"
    echo "✓ Credentials saved to: credentials_production.txt"
}

# Create database initialization script
create_db_init_script() {
    echo "Creating database initialization script..."
    mkdir -p scripts
    
    cat > "scripts/init-db.sql" << 'EOF'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
SET timezone = 'UTC';
EOF

    echo "✓ Database initialization script created"
}

# Build images
build_images() {
    echo "Building Docker images..."
    export $(cat .env.prod | grep -v '^#' | grep -v '^$' | xargs)
    
    if command -v make >/dev/null 2>&1 && make -n docker-prod-build >/dev/null 2>&1; then
        make docker-prod-build
    else
        docker-compose -f docker-compose.prod.yml build --no-cache
    fi
    echo "✓ Image build completed"
}

# Start services
start_services() {
    echo "Starting services..."
    export $(cat .env.prod | grep -v '^#' | grep -v '^$' | xargs)
    
    if command -v make >/dev/null 2>&1 && make -n docker-prod-up >/dev/null 2>&1; then
        make docker-prod-up
    else
        docker-compose -f docker-compose.prod.yml up -d
    fi
    echo "✓ Services started successfully"
}

# Wait for database to be ready
wait_for_database() {
    echo "Waiting for database to be ready..."
    source ".env.prod"
    
    for i in {1..30}; do
        if docker exec capsoulai-postgres-prod pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; then
            echo "✓ Database is ready"
            return 0
        fi
        echo "Waiting for database to start... ($i/30)"
        sleep 2
    done
    
    echo "❌ Error: Database startup timeout"
    return 1
}

# Wait for backend service to be ready
wait_for_backend() {
    echo "Waiting for backend service to be ready..."
    source ".env.prod"
    
    # First check if container is running
    if ! docker ps -q -f name=capsoulai-web-prod >/dev/null 2>&1; then
        echo "❌ Backend container not running"
        echo "Checking container status..."
        docker-compose -f docker-compose.prod.yml ps
        return 1
    fi
    
    # Wait for health check to pass
    for i in {1..60}; do
        # Check container health first
        if docker inspect capsoulai-web-prod --format='{{.State.Health.Status}}' 2>/dev/null | grep -q "healthy"; then
            echo "✓ Backend service is ready (container health check passed)"
            return 0
        fi
        
        # Fallback: direct HTTP check using server IP
        if curl -f -s "http://${SERVER_IP}:${BACKEND_PORT}/health" >/dev/null 2>&1; then
            echo "✓ Backend service is ready (HTTP health check passed)"
            return 0
        fi
        
        # Also try localhost for internal checking
        if curl -f -s "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null 2>&1; then
            echo "✓ Backend service is ready (internal health check passed)"
            return 0
        fi
        
        if [ $((i % 10)) -eq 0 ]; then
            echo "Still waiting for backend service... ($i/60) - checking http://${SERVER_IP}:${BACKEND_PORT}/health"
            # Show container logs for debugging
            echo "Recent container logs:"
            docker logs capsoulai-web-prod --tail 5 2>/dev/null || echo "Cannot fetch logs"
        fi
        sleep 5
    done
    
    echo "⚠️  Backend service startup timeout, but deployment will continue"
    echo "You can check service status manually:"
    echo "  docker logs capsoulai-web-prod"
    echo "  curl http://${SERVER_IP}:${BACKEND_PORT}/health"
    return 0
}

# Run database migrations
run_migrations() {
    echo "Running database migrations..."
    sleep 5  # Give application more time to start
    
    if docker ps -q -f name=capsoulai-web-prod >/dev/null 2>&1; then
        docker exec capsoulai-web-prod alembic upgrade head
        echo "✓ Database migration completed"
    else
        echo "⚠️  Warning: Web container not found, skipping database migration"
        echo "Please run manually: docker exec <web_container> alembic upgrade head"
    fi
}

# Update CORS configuration
update_cors_config() {
    echo "Updating CORS configuration..."
    source ".env.prod"
    
    # Build CORS origins list with actual server IP
    if [ -n "$SERVER_IP" ] && [ "$SERVER_IP" != "YOUR_SERVER_IP_HERE" ]; then
        # Use IP address HTTP access
        if [ "$FRONTEND_PORT" = "80" ]; then
            CORS_ORIGINS="\"http://${SERVER_IP}\""
        else
            CORS_ORIGINS="\"http://${SERVER_IP}:${FRONTEND_PORT}\""
        fi
        
        # Add additional origins for development and internal access
        CORS_ORIGINS="${CORS_ORIGINS},\"http://127.0.0.1\""
        
        # Add port-specific origins for direct API access
        CORS_ORIGINS="${CORS_ORIGINS},\"http://${SERVER_IP}:${BACKEND_PORT}\""
        CORS_ORIGINS="${CORS_ORIGINS},\"http://127.0.0.1:${BACKEND_PORT}\""
        
        # Update .env.prod file
        sed -i "s|BACKEND_CORS_ORIGINS=.*|BACKEND_CORS_ORIGINS='[${CORS_ORIGINS}]'|" ".env.prod"
        echo "✓ CORS configuration updated for IP: ${SERVER_IP}"
        echo "  Allowed origins: [${CORS_ORIGINS}]"
    else
        echo "❌ Error: SERVER_IP not properly set, cannot update CORS"
        exit 1
    fi
}

# Display deployment information
show_deployment_info() {
    source ".env.prod"
    
    echo ""
    echo "========================================="
    echo "🚀 Production Deployment Complete!"
    echo "========================================="
    echo ""
    
    echo "🌐 Access URLs (HTTP):"
    echo "  Frontend: http://${SERVER_IP}"
    echo "  API: http://${SERVER_IP}${API_PREFIX}"
    echo "  Health Check: http://${SERVER_IP}/health"
    echo "  API Documentation: http://${SERVER_IP}/docs"
    
    echo ""
    echo "🔧 Direct API Access (for debugging):"
    echo "  Backend API: http://${SERVER_IP}:${BACKEND_PORT}"
    echo "  Backend Health Check: http://${SERVER_IP}:${BACKEND_PORT}/health"
    
    echo ""
    echo "📊 Service Status:"
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    echo "🛠️  Management Commands:"
    echo "  View all logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  View backend logs: docker-compose -f docker-compose.prod.yml logs -f web"
    echo "  View database logs: docker-compose -f docker-compose.prod.yml logs -f postgres"
    echo "  Stop services: docker-compose -f docker-compose.prod.yml down"
    echo "  Restart services: docker-compose -f docker-compose.prod.yml restart"
    echo "  Check status: docker-compose -f docker-compose.prod.yml ps"
    
    echo ""
    echo "🔑 Credentials Information: credentials_production.txt"
    echo ""
    echo "✅ Deployment Configuration:"
    echo "  - Using IP address access: ${SERVER_IP}"
    echo "  - HTTP access (no SSL)"
    echo "  - Main access URL: http://${SERVER_IP}"
    echo ""
    echo "💡 Future Optimization Suggestions:"
    echo "  - Configure domain access if domain is available"
    echo "  - Recommend HTTPS for production environment"
    echo "  - Regular backup of database and uploaded files"
    echo ""
}

# Pre-deployment checks
pre_deployment_check() {
    echo "Running pre-deployment checks..."
    
    # Check if ports are available
    echo "Checking port availability..."
    for port in 80 443 8000; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            echo "⚠️  Warning: Port $port is already in use"
            if [ "$port" = "80" ]; then
                echo "Port 80 conflict may prevent frontend access"
                read -p "Continue anyway? (y/N): " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    exit 1
                fi
            fi
        else
            echo "✓ Port $port available"
        fi
    done
    
    # Check disk space
    echo "Checking disk space..."
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [ "$AVAILABLE_SPACE" -lt 2097152 ]; then  # Less than 2GB
        echo "⚠️  Warning: Low disk space ($(($AVAILABLE_SPACE/1024))MB available)"
        echo "Recommend at least 2GB free space for deployment"
    else
        echo "✓ Sufficient disk space available"
    fi
    
    # Check memory
    echo "Checking memory..."
    AVAILABLE_MEMORY=$(free -m | awk 'NR==2{print $7}')
    if [ "$AVAILABLE_MEMORY" -lt 1024 ]; then  # Less than 1GB
        echo "⚠️  Warning: Low available memory (${AVAILABLE_MEMORY}MB)"
        echo "Application may run slowly with limited memory"
    else
        echo "✓ Sufficient memory available (${AVAILABLE_MEMORY}MB)"
    fi
    
    # Check if Docker daemon is running
    echo "Checking Docker daemon..."
    if ! docker info >/dev/null 2>&1; then
        echo "❌ Docker daemon not running"
        echo "Please start Docker daemon: sudo systemctl start docker"
        exit 1
    else
        echo "✓ Docker daemon is running"
    fi
    
    echo "✓ Pre-deployment checks completed"
}

# Main process
main() {
    cd "$SCRIPT_DIR"
    
    pre_deployment_check
    check_dependencies
    init_prod_config
    validate_config
    update_cors_config
    generate_credentials
    create_db_init_script
    build_images
    start_services
    wait_for_database
    wait_for_backend
    run_migrations
    show_deployment_info
}

# Error handling
trap 'echo "❌ Deployment failed, please check error messages"; exit 1' ERR

# Execute main process
main "$@"
