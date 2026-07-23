# 构建阶段
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm ci

COPY . .

RUN npm run build

# 输出：静态文件在 /app/dist
