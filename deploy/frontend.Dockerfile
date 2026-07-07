# =====================================================================
# Angular UI -> static build -> nginx.
# Build context is ../frontend/careerpilot-ui.
# =====================================================================
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Angular 17 `application` builder outputs to dist/careerpilot-ui/browser/
RUN npm run build -- --configuration production

FROM nginx:1.27-alpine
# SPA routing: unknown paths fall back to index.html
COPY --from=build /app/dist/careerpilot-ui/browser/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
