#!/bin/bash
# ===========================================
# B-ORTIM Database Restore Script
# ===========================================
# USE WITH CAUTION - This will overwrite the current database!
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Configuration
BACKUP_FILE="${1:-}"
DB_CONTAINER="${DB_CONTAINER:-bortim-db}"
DB_USER="${DB_USER:-bortim}"
DB_NAME="${DB_NAME:-bortim}"

# Validate input
if [ -z "${BACKUP_FILE}" ]; then
    log_error "Usage: $0 <backup_file.dump>"
    echo ""
    echo "Available backups:"
    ls -lh /backups/*.dump 2>/dev/null || echo "No local backups found"
    exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    log_error "Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

# Confirmation
echo ""
log_warn "=========================================="
log_warn "  DATABASE RESTORE - DESTRUCTIVE ACTION"
log_warn "=========================================="
echo ""
echo "This will OVERWRITE the current database!"
echo "Backup file: ${BACKUP_FILE}"
echo ""
read -p "Type 'RESTORE' to confirm: " confirmation
if [ "$confirmation" != "RESTORE" ]; then
    log_error "Restore cancelled"
    exit 1
fi

# Create current state backup first
log_info "Creating safety backup of current database..."
SAFETY_BACKUP="/backups/pre_restore_$(date +%Y%m%d_%H%M%S).dump"
docker exec ${DB_CONTAINER} pg_dump \
    -U ${DB_USER} \
    --format=custom \
    ${DB_NAME} > "${SAFETY_BACKUP}"
log_info "Safety backup created: ${SAFETY_BACKUP}"

# Stop application services
log_info "Stopping application services..."
docker-compose stop api web 2>/dev/null || true

# Restore database
log_info "Restoring database from backup..."

# Drop existing connections
docker exec ${DB_CONTAINER} psql -U ${DB_USER} -d postgres -c "
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = '${DB_NAME}'
    AND pid <> pg_backend_pid();
"

# Drop and recreate database
docker exec ${DB_CONTAINER} psql -U ${DB_USER} -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
docker exec ${DB_CONTAINER} psql -U ${DB_USER} -d postgres -c "CREATE DATABASE ${DB_NAME};"

# Restore from backup
cat "${BACKUP_FILE}" | docker exec -i ${DB_CONTAINER} pg_restore \
    -U ${DB_USER} \
    -d ${DB_NAME} \
    --verbose \
    --no-owner \
    --no-privileges

log_info "Database restored successfully"

# Start application services
log_info "Starting application services..."
docker-compose start api web 2>/dev/null || true

# Verify
log_info "Verifying restoration..."
sleep 5

if docker-compose exec -T api npx prisma db execute --stdin <<< "SELECT 1" > /dev/null 2>&1; then
    log_info "Database connection verified"
else
    log_error "Database connection failed! Rolling back..."
    cat "${SAFETY_BACKUP}" | docker exec -i ${DB_CONTAINER} pg_restore \
        -U ${DB_USER} \
        -d ${DB_NAME} \
        --clean \
        --no-owner
    exit 1
fi

log_info "=========================================="
log_info "Database restore completed successfully!"
log_info "=========================================="
echo ""
log_info "Safety backup available at: ${SAFETY_BACKUP}"
