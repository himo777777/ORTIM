#!/bin/bash
# ===========================================
# B-ORTIM Staging Deployment Script
# ===========================================
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
ENVIRONMENT="staging"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
DEPLOY_HOST="${STAGING_HOST:-}"
DEPLOY_USER="${STAGING_USER:-deploy}"

# Validate required environment variables
check_requirements() {
    log_info "Checking requirements..."

    if [ -z "$DEPLOY_HOST" ]; then
        log_error "STAGING_HOST is not set"
        exit 1
    fi

    if [ -z "${SSH_PRIVATE_KEY:-}" ] && [ ! -f ~/.ssh/id_rsa ]; then
        log_error "SSH key not configured"
        exit 1
    fi

    log_info "Requirements check passed"
}

# Pull latest images
pull_images() {
    log_info "Pulling latest Docker images..."

    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
        docker pull ${DOCKER_REGISTRY}/b-ortim/api:${IMAGE_TAG}
        docker pull ${DOCKER_REGISTRY}/b-ortim/web:${IMAGE_TAG}
EOF

    log_info "Images pulled successfully"
}

# Create database backup before deployment
backup_database() {
    log_info "Creating database backup before deployment..."

    BACKUP_FILE="backup_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).sql"

    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
        docker exec bortim-db pg_dump -U bortim bortim > /backups/${BACKUP_FILE}
        gzip /backups/${BACKUP_FILE}
        echo "Backup created: ${BACKUP_FILE}.gz"
EOF

    log_info "Database backup completed"
}

# Deploy services
deploy_services() {
    log_info "Deploying services to ${ENVIRONMENT}..."

    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
        cd /opt/bortim

        # Update docker-compose with new images
        export API_IMAGE=${DOCKER_REGISTRY}/b-ortim/api:${IMAGE_TAG}
        export WEB_IMAGE=${DOCKER_REGISTRY}/b-ortim/web:${IMAGE_TAG}

        # Stop old containers gracefully
        docker-compose stop api web

        # Remove old containers
        docker-compose rm -f api web

        # Start new containers
        docker-compose up -d api web

        # Wait for services to be healthy
        echo "Waiting for services to start..."
        sleep 10

        # Check health
        if curl -sf http://localhost:4000/api/health > /dev/null; then
            echo "API is healthy"
        else
            echo "API health check failed!"
            exit 1
        fi

        if curl -sf http://localhost:3000 > /dev/null; then
            echo "Web is healthy"
        else
            echo "Web health check failed!"
            exit 1
        fi
EOF

    log_info "Services deployed successfully"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."

    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
        cd /opt/bortim
        docker-compose exec -T api npx prisma migrate deploy
EOF

    log_info "Migrations completed"
}

# Cleanup old images
cleanup() {
    log_info "Cleaning up old Docker images..."

    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
        docker image prune -f --filter "until=24h"
EOF

    log_info "Cleanup completed"
}

# Main deployment flow
main() {
    log_info "Starting ${ENVIRONMENT} deployment..."
    log_info "Image tag: ${IMAGE_TAG}"

    check_requirements
    backup_database
    pull_images
    deploy_services
    run_migrations
    cleanup

    log_info "=========================================="
    log_info "Deployment to ${ENVIRONMENT} completed!"
    log_info "=========================================="
}

# Run main function
main "$@"
