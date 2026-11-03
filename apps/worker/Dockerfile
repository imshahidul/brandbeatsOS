# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/worker/package.json ./apps/worker/
COPY apps/api/package.json ./apps/api/
COPY packages/theme-sdk/package.json ./packages/theme-sdk/
RUN npm ci
COPY . .
RUN npm run build --workspace=@brand-beats/worker

# ---- runtime ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/worker/package.json ./apps/worker/
COPY apps/api/package.json ./apps/api/
COPY packages/theme-sdk/package.json ./packages/theme-sdk/
RUN npm ci --omit=dev
COPY --from=build /app/apps/worker/dist ./apps/worker/dist
# tsc nests output as dist/worker/src + dist/api (worker imports api sources)
CMD ["node", "apps/worker/dist/worker/src/main.js"]
