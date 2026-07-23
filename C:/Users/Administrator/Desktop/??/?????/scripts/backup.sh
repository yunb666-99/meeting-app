#!/bin/bash
# ============================================
# MeetingApp 数据库备份脚本
# 使用方法: ./scripts/backup.sh
# ============================================

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/meetingapp_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo ">>> 正在备份数据库..."
docker compose exec -T postgres pg_dump -U meetingapp meetingapp | gzip > "$BACKUP_FILE"

echo "[OK] 数据库已备份到: $BACKUP_FILE"

# 只保留最近 30 个备份
ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm

echo "[OK] 备份完成（自动清理旧备份，保留最近 30 个）"
