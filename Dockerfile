FROM node:22-alpine AS build

WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@11.17.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

COPY apps/web apps/web

ARG VITE_OPS_API_BASE_URL
ARG VITE_OPS_API_ALLOWED_ORIGINS
ARG VITE_OPS_ALLOW_INSECURE_HTTP=false
ENV VITE_OPS_API_BASE_URL=$VITE_OPS_API_BASE_URL \
    VITE_OPS_API_ALLOWED_ORIGINS=$VITE_OPS_API_ALLOWED_ORIGINS \
    VITE_OPS_ALLOW_INSECURE_HTTP=$VITE_OPS_ALLOW_INSECURE_HTTP

RUN pnpm --filter @english-room-op/web build

FROM nginx:1.27-alpine

COPY apps/web/docker/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80
