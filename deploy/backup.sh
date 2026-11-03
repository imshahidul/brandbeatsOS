#!/usr/bin/env bash
# Nightly Postgres backup for Brand Beats OS (small-VPS friendly).
# Usage: bb-backup /path/to/brand-beats-os   (keeps 7 days of dumps)
set -euo pipefail

PROJECT_DIR="${1:?usage: bb-backup /path/to/brand-beats-os}"
BACKUP_DIR="$PROJECT_DIR/backups"
mkdir -p "$BACKUP_DIR"

STAMP="$(date +%F_%H%M)"
FILE="$BACKUP_DIR/brandbeats_$STAMP.sql.gz"

docker compose -f "$PROJECT_DIR/deploy/docker-compose.yml" \
  exec -T db pg_dump -U "${POSTGRES_USER:-brandbeats}" "${POSTGRES_DB:-brandbeats}" \
  | gzip > "$FILE"

# keep 7 days
find "$BACKUP_DIR" -name 'brandbeats_*.sql.gz' -mtime +7 -delete

echo "backup written: $FILE"
