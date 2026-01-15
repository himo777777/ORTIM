#!/bin/bash
# ===========================================
# B-ORTIM Database Backup Script
# ===========================================
# Can be run manually or via cron
# Cron example (daily at 2 AM):
# 0 2 * * * /opt/bortim/scripts/backup-database.sh production >> /var/log/bortim-backup.log 2>&1
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1"; }
log_warn() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1"; }
log_error() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1"; }

# Configuration
ENVIRONMENT="${1:-production}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
S3_BUCKET="${AWS_S3_BACKUP_BUCKET:-}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DB_CONTAINER="${DB_CONTAINER:-bortim-db}"
DB_USER="${DB_USER:-bortim}"
DB_NAME="${DB_NAME:-bortim}"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="bortim_${ENVIRONMENT}_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Create database backup
create_backup() {
    log_info "Starting database backup for ${ENVIRONMENT}..."

    # Create custom format backup (best for restoration)
    log_info "Creating custom format backup..."
    docker exec ${DB_CONTAINER} pg_dump \
        -U ${DB_USER} \
        --format=custom \
        --compress=9 \
        --verbose \
        ${DB_NAME} > "${BACKUP_PATH}.dump"

    # Create SQL backup (human readable)
    log_info "Creating SQL backup..."
    docker exec ${DB_CONTAINER} pg_dump \
        -U ${DB_USER} \
        --format=plain \
        ${DB_NAME} | gzip > "${BACKUP_PATH}.sql.gz"

    # Verify backups
    if [ ! -s "${BACKUP_PATH}.dump" ]; then
        log_error "Backup file is empty!"
        exit 1
    fi

    DUMP_SIZE=$(ls -lh "${BACKUP_PATH}.dump" | awk '{print $5}')
    SQL_SIZE=$(ls -lh "${BACKUP_PATH}.sql.gz" | awk '{print $5}')

    log_info "Backups created:"
    log_info "  - ${BACKUP_NAME}.dump (${DUMP_SIZE})"
    log_info "  - ${BACKUP_NAME}.sql.gz (${SQL_SIZE})"
}

# Upload to S3
upload_to_s3() {
    if [ -z "${S3_BUCKET}" ]; then
        log_warn "S3_BUCKET not configured, skipping upload"
        return
    fi

    log_info "Uploading backups to S3..."

    aws s3 cp "${BACKUP_PATH}.dump" \
        "s3://${S3_BUCKET}/db-backups/${ENVIRONMENT}/${BACKUP_NAME}.dump" \
        --storage-class STANDARD_IA

    aws s3 cp "${BACKUP_PATH}.sql.gz" \
        "s3://${S3_BUCKET}/db-backups/${ENVIRONMENT}/${BACKUP_NAME}.sql.gz" \
        --storage-class STANDARD_IA

    log_info "Backups uploaded to S3"
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."

    # Local cleanup
    find "${BACKUP_DIR}" -name "bortim_${ENVIRONMENT}_*.dump" -mtime +${RETENTION_DAYS} -delete
    find "${BACKUP_DIR}" -name "bortim_${ENVIRONMENT}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

    # S3 lifecycle rules should handle S3 cleanup, but we can also do it here
    if [ -n "${S3_BUCKET}" ]; then
        # List and delete old backups in S3
        aws s3 ls "s3://${S3_BUCKET}/db-backups/${ENVIRONMENT}/" \
            | awk '{print $4}' \
            | while read file; do
                file_date=$(echo "$file" | grep -oP '\d{8}' | head -1)
                if [ -n "$file_date" ]; then
                    file_epoch=$(date -d "${file_date:0:4}-${file_date:4:2}-${file_date:6:2}" +%s 2>/dev/null || echo "0")
                    cutoff_epoch=$(date -d "-${RETENTION_DAYS} days" +%s)
                    if [ "$file_epoch" -lt "$cutoff_epoch" ] && [ "$file_epoch" -gt "0" ]; then
                        log_info "Deleting old S3 backup: $file"
                        aws s3 rm "s3://${S3_BUCKET}/db-backups/${ENVIRONMENT}/${file}"
                    fi
                fi
            done
    fi

    log_info "Cleanup completed"
}

# Verify backup integrity
verify_backup() {
    log_info "Verifying backup integrity..."

    # Check if we can list contents
    pg_restore --list "${BACKUP_PATH}.dump" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_info "Backup integrity verified"
    else
        log_error "Backup verification failed!"
        exit 1
    fi
}

# Send notification
send_notification() {
    local status="${1:-success}"
    local message="${2:-}"

    # Slack notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        if [ "$status" == "success" ]; then
            emoji="✅"
        else
            emoji="❌"
        fi

        curl -s -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"${emoji} B-ORTIM backup (${ENVIRONMENT}): ${message}\"}" \
            "${SLACK_WEBHOOK_URL}" || true
    fi
}

# Main function
main() {
    log_info "=========================================="
    log_info "B-ORTIM Database Backup - ${ENVIRONMENT}"
    log_info "=========================================="

    create_backup
    verify_backup
    upload_to_s3
    cleanup_old_backups

    FINAL_SIZE=$(ls -lh "${BACKUP_PATH}.dump" | awk '{print $5}')
    send_notification "success" "Backup completed successfully (${FINAL_SIZE})"

    log_info "=========================================="
    log_info "Backup completed successfully!"
    log_info "=========================================="
}

# Error handling
trap 'log_error "Backup failed!"; send_notification "error" "Backup failed!"' ERR

# Run main
main "$@"
