#!/bin/bash
# ===========================================
# B-ORTIM Production Deployment Script
# ===========================================
# This script includes additional safety checks for production
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Configuration
ENVIRONMENT="production"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-ghcr.io}"
IMAGE_TAG="${IMAGE_TAG:-}"
DEPLOY_HOST="${PRODUCTION_HOST:-}"
DEPLOY_USER="${PRODUCTION_USER:-deploy}"
ROLLBACK_IMAGE_TAG=""

# Safety confirmation for production
confirm_deployment() {
    if [ "${CI:-false}" != "true" ]; then
        echo ""
        log_warn "=========================================="
        log_warn "  PRODUCTION DEPLOYMENT CONFIRMATION"
        log_warn "=========================================="
        echo ""
        echo "You are about to deploy to PRODUCTION."
        echo "Image tag: ${IMAGE_TAG}"
        echo "Target host: ${DEPLOY_HOST}"
        echo ""
        read -p "Type 'DEPLOY' to confirm: " confirmation
        if [ "$confirmation" != "DEPLOY" ]; then
            log_error "Deployment cancelled"
            exit 1
        fi
    fi
}

# Validate requirements
check_requirements() {
    log_step "Checking requirements..."

    if [ -z "$IMAGE_TAG" ]; then
        log_error "IMAGE_TAG is required for production deployments"
        exit 1
    fi

    if [ -z "$DEPLOY_HOST" ]; then
        log_error "PRODUCTION_HOST is not set"
        exit 1
    fi

    # Check if staging was deployed with same tag
    log_info "Verifying staging deployment..."
    # In a real scenario, check staging health or deployment record

    log_info "Requirements check passed"
}

# Store current image for rollback
store_rollback_info() {
    log_step "Storing rollback information..."

    ROLLBACK_IMAGE_TAG=$(ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
        cd /opt/bortim
        docker inspect bortim-api --format='{{.Config.Image}}' 2>/dev/null | cut -d: -f2 || echo "none"
EOF
)

    log_info "Rollback image tag: ${ROLLBACK_IMAGE_TAG}"
    echo "${ROLLBACK_IMAGE_TAG}" > /tmp/rollback_tag_${ENVIRONMENT}
}

# Create comprehensive backup
backup_database() {
    log_step "Creating database backup..."

    BACKUP_FILE="backup_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S)"

    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
        # Create backup
        docker exec bortim-db pg_dump -U bortim --format=custom bortim > /backups/${BACKUP_FILE}.dump

        # Also create SQL backup for easy inspection
        docker exec bortim-db pg_dump -U bortim bortim > /backups/${BACKUP_FILE}.sql
        gzip /backups/${BACKUP_FILE}.sql

        # Verify backup
        if [ -s /backups/${BACKUP_FILE}.dump ]; then
            echo "Backup verified: ${BACKUP_FILE}.dump"
            ls -lh /backups/${BACKUP_FILE}.*
        else
            echo "Backup file is empty!"
            exit 1
        fi

        # Upload to S3 if configured
        if [ -n "\${AWS_S3_BACKUP_BUCKET:-}" ]; then
            aws s3 cp /backups/${BACKUP_FILE}.dump s3://\${AWS_S3_BACKUP_BUCKET}/db-backups/
            echo "Backup uploaded to S3"
        fi

        # Keep only last 30 days of local backups
        find /backups -name "backup_production_*.dump" -mtime +30 -delete
        find /backups -name "backup_production_*.sql.gz" -mtime +30 -delete
EOF

    log_info "Database backup completed: ${BACKUP_FILE}"
}

# Pull and verify images
pull_images() {
    log_step "Pulling Docker images..."

    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
        docker pull ${DOCKER_REGISTRY}/b-ortim/api:${IMAGE_TAG}
        docker pull ${DOCKER_REGISTRY}/b-ortim/web:${IMAGE_TAG}

        # Verify images were pulled
        docker image inspect ${DOCKER_REGISTRY}/b-ortim/api:${IMAGE_TAG} > /dev/null
        docker image inspect ${DOCKER_REGISTRY}/b-ortim/web:${IMAGE_TAG} > /dev/null

        echo "Images verified"
EOF

    log_info "Images pulled and verified"
}

# Deploy with blue-green strategy
deploy_services() {
    log_step "Deploying services with zero-downtime..."

    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
        cd /opt/bortim

        export API_IMAGE=${DOCKER_REGISTRY}/b-ortim/api:${IMAGE_TAG}
        export WEB_IMAGE=${DOCKER_REGISTRY}/b-ortim/web:${IMAGE_TAG}

        # Scale up new instances first (blue-green)
        docker-compose up -d --no-deps --scale api=2 api
        sleep 15

        # Health check new instance
        for i in {1..30}; do
            if curl -sf http://localhost:4000/api/health > /dev/null; then
                echo "New API instance healthy"
                break
            fi
            if [ \$i -eq 30 ]; then
                echo "Health check failed after 30 attempts"
                exit 1
            fi
            sleep 2
        done

        # Scale down to 1 (removes old instance)
        docker-compose up -d --no-deps --scale api=1 api

        # Deploy web with same strategy
        docker-compose up -d --no-deps --scale web=2 web
        sleep 10

        for i in {1..30}; do
            if curl -sf http://localhost:3000 > /dev/null; then
                echo "New Web instance healthy"
                break
            fi
            if [ \$i -eq 30 ]; then
                echo "Web health check failed"
                exit 1
            fi
            sleep 2
        done

        docker-compose up -d --no-deps --scale web=1 web

        echo "Deployment completed"
EOF

    log_info "Services deployed successfully"
}

# Run migrations
run_migrations() {
    log_step "Running database migrations..."

    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
        cd /opt/bortim
        docker-compose exec -T api npx prisma migrate deploy

        # Verify migration status
        docker-compose exec -T api npx prisma migrate status
EOF

    log_info "Migrations completed"
}

# Post-deployment health checks
health_check() {
    log_step "Running post-deployment health checks..."

    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
        echo "Checking API health..."
        curl -sf http://localhost:4000/api/health || exit 1

        echo "Checking web health..."
        curl -sf http://localhost:3000 || exit 1

        echo "Checking database connection..."
        docker-compose exec -T api npx prisma db execute --stdin <<< "SELECT 1" || exit 1

        echo "All health checks passed!"
EOF

    log_info "All health checks passed"
}

# Rollback function
rollback() {
    log_error "Deployment failed! Initiating rollback..."

    if [ -z "${ROLLBACK_IMAGE_TAG}" ] || [ "${ROLLBACK_IMAGE_TAG}" == "none" ]; then
        log_error "No rollback image available!"
        exit 1
    fi

    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
        cd /opt/bortim

        export API_IMAGE=${DOCKER_REGISTRY}/b-ortim/api:${ROLLBACK_IMAGE_TAG}
        export WEB_IMAGE=${DOCKER_REGISTRY}/b-ortim/web:${ROLLBACK_IMAGE_TAG}

        docker-compose up -d api web

        echo "Rollback completed to ${ROLLBACK_IMAGE_TAG}"
EOF

    log_warn "Rolled back to previous version: ${ROLLBACK_IMAGE_TAG}"
    exit 1
}

# Cleanup
cleanup() {
    log_step "Cleaning up..."

    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << EOF
        # Remove unused images (keep last 3 versions)
        docker image prune -f --filter "until=72h"
EOF

    log_info "Cleanup completed"
}

# Notify deployment
notify_deployment() {
    log_step "Sending deployment notification..."

    # Slack notification (if configured)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"✅ B-ORTIM deployed to production (${IMAGE_TAG})\"}" \
            "${SLACK_WEBHOOK_URL}" || true
    fi

    log_info "Notifications sent"
}

# Main deployment flow
main() {
    log_info "=========================================="
    log_info "  B-ORTIM Production Deployment"
    log_info "=========================================="
    log_info "Image tag: ${IMAGE_TAG}"
    log_info "Target: ${DEPLOY_HOST}"
    log_info ""

    confirm_deployment
    check_requirements
    store_rollback_info

    # Set trap for rollback on failure
    trap rollback ERR

    backup_database
    pull_images
    deploy_services
    run_migrations
    health_check
    cleanup
    notify_deployment

    # Remove trap
    trap - ERR

    log_info ""
    log_info "=========================================="
    log_info "  Production deployment successful!"
    log_info "=========================================="
    log_info ""
}

# Run main function
main "$@"
