FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY apps/notification-service ./apps/notification-service
RUN npm install
RUN npm run build --workspace=@jiraclone/shared
RUN npm run build --workspace=@jiraclone/notification-service

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/notification-service ./apps/notification-service
EXPOSE 4005
CMD ["node", "apps/notification-service/src/index.js"]
