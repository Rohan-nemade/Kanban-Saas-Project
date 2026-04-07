FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY apps/task-service ./apps/task-service
RUN npm install
RUN npm run build --workspace=@jiraclone/shared
RUN npm run build --workspace=@jiraclone/task-service

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/task-service ./apps/task-service
EXPOSE 4004
CMD ["node", "apps/task-service/src/index.js"]
