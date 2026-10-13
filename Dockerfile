# Etapa 1: compilar la SPA con Vite
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Etapa 2: certificado TLS autofirmado para el ambiente QA
FROM alpine:3.20 AS certs
RUN apk add --no-cache openssl && \
    openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
      -subj "/CN=localhost" \
      -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
      -keyout /tls.key -out /tls.crt

# Etapa 3: imagen final solo con nginx y los archivos compilados
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=certs /tls.crt /etc/nginx/tls/tls.crt
COPY --from=certs /tls.key /etc/nginx/tls/tls.key
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80 443