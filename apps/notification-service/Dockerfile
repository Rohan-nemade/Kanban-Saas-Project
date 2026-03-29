FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY apps/notification-service ./apps/notification-service
RUN npm install
RUN npm run generate --workspace=@jiraclone/database
RUN npm run build --workspace=@jiraclone/shared
RUN npm run build --workspace=@jiraclone/notification-service

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/notification-service/dist ./apps/notification-service/dist
COPY --from=builder /app/apps/notification-service/package.json ./apps/notification-service/
EXPOSE 4005
CMD ["node", "apps/notification-service/dist/index.js"]
