# syntax=docker/dockerfile:1.7
# Frontend: build the PWA with Vite, serve it with nginx.
# Build context is the repository root (see docker-compose.yml).

FROM node:24-alpine AS build
WORKDIR /app
ENV CI=true
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM nginx:1.30-alpine
# nginx's entrypoint renders /etc/nginx/templates/*.template with envsubst
# (API_UPSTREAM) and runs /docker-entrypoint.d/* scripts (runtime config.js).
COPY docker/web/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --chmod=755 docker/web/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
COPY --from=build /app/dist /usr/share/nginx/html
ENV API_UPSTREAM=http://api:8080
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
