# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/theme-sdk/package.json ./packages/theme-sdk/
RUN npm ci
COPY . .
RUN npm run build --workspace=@brand-beats/api

# ---- runtime ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/theme-sdk/package.json ./packages/theme-sdk/
RUN npm ci --omit=dev
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/theme-sdk/dist ./packages/theme-sdk/dist
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
