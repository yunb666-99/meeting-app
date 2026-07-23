#!/bin/bash
# ============================================
# MeetingApp 一键部署脚本
# 使用方法: chmod +x setup.sh && ./setup.sh
# ============================================

set -e

echo "========================================="
echo "  MeetingApp 视频会议系统 - 部署脚本"
echo "========================================="
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "[错误] 未检测到 Docker，请先安装 Docker"
    echo "Ubuntu: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

if ! command -v docker compose &> /dev/null; then
    echo "[错误] 未检测到 docker compose，请安装 Docker Compose v2"
    exit 1
fi

echo "[OK] Docker 环境检查通过"
echo ""

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo ">>> 未检测到 .env 文件，正在创建..."
    cp .env.example .env

    # 自动生成随机密码
    DB_PASSWORD=$(openssl rand -hex 16)
    REDIS_PASSWORD=$(openssl rand -hex 16)
    JWT_ACCESS_SECRET=$(openssl rand -hex 32)
    JWT_REFRESH_SECRET=$(openssl rand -hex 32)
    LIVEKIT_API_KEY="meetingapp-key"
    LIVEKIT_API_SECRET=$(openssl rand -hex 32)

    # 替换 .env 中的占位符
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
    sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
    sed -i "s/JWT_ACCESS_SECRET=.*/JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET/" .env
    sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .env
    sed -i "s/LIVEKIT_API_SECRET=.*/LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET/" .env

    # 交互式输入域名和服务器IP
    read -p "请输入服务器域名 (例: meeting.example.com): " DOMAIN
    read -p "请输入服务器公网IP地址: " SERVER_IP

    sed -i "s/meeting.example.com/$DOMAIN/g" .env
    sed -i "s/1.2.3.4/$SERVER_IP/g" .env

    echo "[OK] .env 文件已创建"
else
    echo "[OK] .env 文件已存在"
fi

echo ""

# 拉取 Docker 镜像
echo ">>> 正在拉取 Docker 镜像..."
docker compose pull
echo "[OK] 镜像拉取完成"
echo ""

# 构建后端镜像
echo ">>> 正在构建后端镜像..."
docker compose build backend
echo "[OK] 后端镜像构建完成"
echo ""

# 启动服务
echo ">>> 正在启动所有服务..."
docker compose up -d
echo "[OK] 服务已启动"
echo ""

# 等待数据库就绪
echo ">>> 等待数据库就绪..."
sleep 5

# 运行数据库迁移
echo ">>> 正在运行数据库迁移..."
docker compose exec backend npx prisma migrate deploy
echo "[OK] 数据库迁移完成"
echo ""

# 运行种子数据（创建初始管理员）
echo ">>> 正在创建初始管理员账号..."
docker compose exec backend npx prisma db seed
echo "[OK] 初始管理员已创建"
echo ""

echo "========================================="
echo "  部署完成！"
echo "========================================="
echo ""
echo "  访问地址："
echo "  管理后台: https://<你的域名>/admin"
echo "  API文档:  https://<你的域名>/api/docs"
echo ""
echo "  初始管理员账号: 2942146423"
echo "  初始管理员密码: LHX2008..."
echo "  （请登录后立即修改密码！）"
echo ""
echo "  常用命令："
echo "  查看日志: docker compose logs -f"
echo "  重启服务: docker compose restart"
echo "  停止服务: docker compose down"
echo "  备份数据库: ./scripts/backup.sh"
echo "========================================="
