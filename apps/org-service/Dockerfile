FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY apps/org-service ./apps/org-service
RUN npm install
RUN npm run generate --workspace=@jiraclone/database
RUN npm run build --workspace=@jiraclone/shared
RUN npm run build --workspace=@jiraclone/org-service

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/apps/org-service/dist ./apps/org-service/dist
COPY --from=builder /app/apps/org-service/package.json ./apps/org-service/
EXPOSE 4002
CMD ["node", "apps/org-service/dist/index.js"]
