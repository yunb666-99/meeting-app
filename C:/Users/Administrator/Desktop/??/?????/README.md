# MeetingApp — 视频会议系统

## 📋 项目简介

MeetingApp 是一款自部署的视频会议软件，支持 iOS 和 Android 端。  
无需注册即可加入会议，管理员统一管理用户账号。

### 核心功能

- 🎥 **多人视频通话**（最多 10 人）
- 💬 **文字聊天**（会议内群聊）
- 📺 **屏幕共享**（iOS / Android 互通）
- 🎤 **麦克风 / 摄像头独立开关**
- 👑 **主持人控制**（全员静音、踢人、结束会议）
- 📱 **iOS + Android 双端支持**（同一套代码）
- 🖥️ **网页后台管理**（完整的用户管理、会议记录、数据统计）

---

## 🚀 部署指南

### 前置条件

1. 一台 Linux 服务器（推荐 Ubuntu 24.04 LTS）
2. 一个已备案的域名（如 `meeting.example.com`）
3. 服务器已安装 Docker 和 Docker Compose v2

### 安装 Docker

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动 Docker 服务
sudo systemctl enable docker
sudo systemctl start docker

# 验证安装
docker --version
docker compose version
```

### 服务器配置要求

| 配置项 | 最低配置 | 推荐配置 |
|--------|---------|---------|
| CPU | 4 核 | 8 核 |
| 内存 | 8 GB | 16 GB |
| 硬盘 | 50 GB SSD | 100 GB SSD |
| 带宽 | 10 Mbps | 50 Mbps（BGP 多线） |
| 操作系统 | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |

**推荐云服务器**：阿里云 / 腾讯云  
**月费估算**：最低约 200-300 元/月，推荐约 600-900 元/月

### 需要开放的端口

在云服务器安全组中开放以下端口：

| 端口 | 协议 | 用途 |
|------|------|------|
| 80 | TCP | HTTP（重定向到 HTTPS） |
| 443 | TCP | HTTPS / LiveKit TURN over TLS |
| 443 | UDP | LiveKit TURN over TLS (UDP) |
| 7881 | TCP | WebRTC TCP 备用 |
| 50000-50100 | UDP | WebRTC 媒体流 |

---

### 第一步：上传项目到服务器

```bash
# 将整个 MeetingApp 目录上传到服务器
scp -r 会议/ root@你的服务器IP:/opt/meetingapp

# 登录服务器
ssh root@你的服务器IP
cd /opt/meetingapp
```

### 第二步：一键部署

```bash
# 给脚本执行权限
chmod +x scripts/setup.sh scripts/backup.sh

# 运行一键部署脚本
./scripts/setup.sh
```

脚本会自动完成：
1. 生成所有随机密钥
2. 拉取 Docker 镜像
3. 构建后端
4. 启动所有服务（数据库、缓存、API、媒体服务器、反向代理）
5. 运行数据库迁移
6. 创建初始管理员账号

### 第三步：验证部署

部署完成后，访问以下地址验证：

- **管理后台**：`https://你的域名/admin`
- **API 文档**：`https://你的域名/api/docs`

---

## 🔑 初始管理员账号

| 项目 | 内容 |
|------|------|
| 账号 | `2942146423` |
| 密码 | `LHX2008...` |

⚠️ **登录后请立即修改密码！**

---

## 📱 移动端 App 构建

### 环境准备

1. 安装 Flutter SDK（3.22 或以上）
2. 安装 Android Studio（用于 Android 构建）
3. 安装 Xcode（用于 iOS 构建，仅 macOS）

### 配置 API 地址

编辑 `mobile/lib/core/constants.dart`，修改以下内容为你实际的服务器域名：

```dart
static const String apiBaseUrl = 'https://你的域名/api';
static const String livekitWsUrl = 'wss://你的域名';
static const String wsUrl = 'https://你的域名';
```

### 构建 Android APK

```bash
cd mobile
flutter pub get
flutter build apk --release
```

APK 文件位于：`mobile/build/app/outputs/flutter-apk/app-release.apk`

### 构建 iOS IPA

```bash
cd mobile
flutter pub get
cd ios
pod install
cd ..
flutter build ios --release
```

然后使用 Xcode 打开 `ios/Runner.xcworkspace` 进行签名和发布。

---

## 🖥️ 管理后台使用说明

### 登录

1. 打开浏览器访问 `https://你的域名/admin`
2. 输入管理员账号和密码
3. 点击「登录」

### 仪表盘

登录后首页显示：
- **总用户数**：系统中所有启用的用户
- **进行中会议**：当前正在进行的会议数
- **今日会议数**：今天创建的会议总数
- **今日总时长**：今天所有会议累计时长
- **最近会议**：最近 10 条会议记录
- **用户增长趋势**：近 30 天新增用户折线图

### 用户管理

- **创建用户**：点击「创建用户」按钮，填写账号、昵称、密码、角色
  - 普通用户：可以创建和加入会议
  - 管理员：拥有全部权限 + 可以管理后台
- **编辑用户**：修改昵称、角色、状态
- **禁用/启用**：禁用后用户无法登录
- **重置密码**：为用户设置新密码

### 会议记录

- 查看所有历史会议，支持按日期和状态筛选
- 点击「详情」查看会议参与者和聊天记录
- 支持删除会议记录

### 管理员管理

- 管理管理员账号（添加/移除管理员权限）
- 初始管理员 `2942146423` 不可被降权

### 数据统计

- 每日会议数柱状图
- 每日新增用户折线图
- 支持日期范围筛选

---

## 📱 App 使用说明

### 登录

1. 打开 App，进入登录页
2. 输入管理员分配的账号和密码
3. 点击「登录」
4. 登录成功后进入首页

### 快速加入会议（无需登录）

1. 在登录页点击「快速加入会议」
2. 输入 8 位会议号、6 位会议密码、您的昵称
3. 点击「加入会议」
4. 在预览页调整摄像头和麦克风开关
5. 点击「进入会议」

### 创建会议（需登录）

1. 在首页点击「创建会议」
2. 系统自动生成 8 位会议号和 6 位密码
3. 将会议号和密码告知参会者
4. 在预览页调整摄像头和麦克风
5. 点击「进入会议」
6. **会议号在会议界面顶部可见**

### 会议功能

| 按钮 | 功能 |
|------|------|
| 🎤 麦克风 | 开关麦克风（红色表示已静音） |
| 📷 摄像头 | 开关摄像头 |
| 📺 屏幕共享 | 开始/停止屏幕共享 |
| 💬 聊天 | 打开/关闭文字聊天面板 |
| 📞 挂断 | 离开会议 |

### 主持人功能

创建会议的人自动成为主持人，可以：
- **全员静音**：点击「更多」→「全员静音」
- **踢出成员**：点击「更多」→ 选择成员 →「踢出」
- **结束会议**：点击「更多」→「结束会议」

主持人退出后，主持人身份自动转交给下一个人。  
所有人退出后，会议自动结束。

---

## 🛠️ 日常维护

### 查看服务状态

```bash
cd /opt/meetingapp
docker compose ps
```

### 查看日志

```bash
# 查看全部日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f backend
docker compose logs -f livekit
```

### 重启服务

```bash
docker compose restart
```

### 停止服务

```bash
docker compose down
```

### 备份数据库

```bash
./scripts/backup.sh
```

备份文件保存在 `backups/` 目录，自动保留最近 30 个备份。

### 恢复数据库

```bash
# 解压并恢复
gunzip -c backups/meetingapp_20240101_120000.sql.gz | docker compose exec -T postgres psql -U meetingapp meetingapp
```

### 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker compose build backend
docker compose up -d

# 运行数据库迁移（如有）
docker compose exec backend npx prisma migrate deploy
```

---

## ❓ 常见问题

### 1. 用户无法视频通话

- 检查服务器防火墙是否开放了 443/UDP、7881/TCP、50000-50100/UDP
- 检查云服务器安全组设置
- 确认 LiveKit 服务正在运行：`docker compose ps livekit`

### 2. 忘记管理员密码

```bash
# 进入后端容器重置密码
docker compose exec backend node -e "
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function reset() {
  const hash = await bcrypt.hash('新密码', 10);
  await prisma.user.update({ where: { account: '2942146423' }, data: { passwordHash: hash } });
  console.log('密码已重置');
}
reset();
"
```

### 3. 磁盘空间不足

```bash
# 清理旧备份
ls -t backups/*.sql.gz | tail -n +31 | xargs -r rm

# 清理 Docker 缓存
docker system prune -a
```

### 4. SSL 证书问题

如果在国内服务器上 Let's Encrypt 证书获取失败，建议：
1. 购买国内 SSL 证书（阿里云/腾讯云提供免费 DV 证书）
2. 手动替换 Caddy 证书路径

---

## 📞 技术支持

本项目为自部署方案，如需技术支持请联系开发者。
