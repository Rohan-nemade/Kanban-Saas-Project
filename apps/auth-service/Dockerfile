FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY apps/auth-service ./apps/auth-service
RUN npm install
RUN npm run build --workspace=@jiraclone/shared
RUN npm run build --workspace=@jiraclone/auth-service

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/auth-service ./apps/auth-service
EXPOSE 4001
CMD ["node", "apps/auth-service/src/index.js"]
