#!/bin/bash
set -e

# 1. Instalar Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
fi
gcloud auth configure-docker ${region}-docker.pkg.dev --quiet

mkdir -p /opt/monolito/local/nginx
cd /opt/monolito

# 2. Escrever nginx.conf
cat << 'NGINX' > local/nginx/nginx.conf
${nginx_content}
NGINX

# 3. Escrever docker-compose.yml
cat << 'COMPOSE' > docker-compose.yml
${compose_content}
COMPOSE

# 4. Escrever .env com os secrets do Secret Manager
cat << 'ENV_EOF' > .env
DB_HOST=${db_host}
DB_NAME=${db_name}
DB_USER=$(gcloud secrets versions access latest --secret="db-user")
DB_PASSWORD=$(gcloud secrets versions access latest --secret="db-password")
JWT_SECRET=$(gcloud secrets versions access latest --secret="jwt-secret")
ENV_EOF
