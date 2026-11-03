# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/storefront/package.json ./apps/storefront/
RUN npm ci
COPY . .
RUN npm run build --workspace=@brand-beats/storefront

# ---- runtime ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/storefront/package.json ./apps/storefront/
RUN npm ci --omit=dev
COPY --from=build /app/apps/storefront/.next ./apps/storefront/.next
COPY --from=build /app/apps/storefront/next.config.mjs ./apps/storefront/next.config.mjs
# next start runs from the app dir; the binary resolves via hoisted node_modules.
WORKDIR /app/apps/storefront
EXPOSE 3100
ENV PORT=3100
CMD ["node", "/app/node_modules/next/dist/bin/next", "start", "-p", "3100"]
