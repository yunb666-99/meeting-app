# ============================================
# Build Stage
# ============================================
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --only=production && npm ci --only=development

COPY . .

RUN npm run build
RUN npx prisma generate

# ============================================
# Production Stage
# ============================================
FROM node:22-alpine AS production

WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/main"]
