#!/bin/bash

# ORTAC SSL Certificate Initialization Script
# This script obtains SSL certificates from Let's Encrypt using Certbot
#
# Usage: ./scripts/init-letsencrypt.sh [--staging]
#
# Options:
#   --staging    Use Let's Encrypt staging server (for testing)

set -e

# Configuration
domains=(ortac.se app.ortac.se api.ortac.se)
rsa_key_size=4096
data_path="./certbot"
email="admin@ortac.se"
staging=0

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --staging) staging=1 ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Check if docker compose is available
if ! command -v docker &> /dev/null; then
    echo "Error: docker is not installed"
    exit 1
fi

# Determine docker compose command
if docker compose version &> /dev/null; then
    docker_compose="docker compose"
elif command -v docker-compose &> /dev/null; then
    docker_compose="docker-compose"
else
    echo "Error: docker compose is not available"
    exit 1
fi

echo "### ORTAC SSL Certificate Setup ###"
echo ""

# Check if certificates already exist
if [ -d "$data_path/conf/live/ortac.se" ]; then
    read -p "Existing certificates found. Replace? (y/N) " decision
    if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
        exit 0
    fi
fi

# Create required directories
echo "Creating directories..."
mkdir -p "$data_path/conf"
mkdir -p "$data_path/www"

# Download recommended TLS parameters
if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
    echo "Downloading recommended TLS parameters..."
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
    curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
fi

# Create dummy certificates for nginx to start
echo "Creating dummy certificates..."
path="/etc/letsencrypt/live/ortac.se"
mkdir -p "$data_path/conf/live/ortac.se"
$docker_compose -f docker-compose.production.yml run --rm --entrypoint "\
    openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1 \
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot

# Start nginx
echo "Starting nginx..."
$docker_compose -f docker-compose.production.yml up --force-recreate -d nginx

# Delete dummy certificates
echo "Deleting dummy certificates..."
$docker_compose -f docker-compose.production.yml run --rm --entrypoint "\
    rm -Rf /etc/letsencrypt/live/ortac.se && \
    rm -Rf /etc/letsencrypt/archive/ortac.se && \
    rm -Rf /etc/letsencrypt/renewal/ortac.se.conf" certbot

# Request real certificates
echo "Requesting Let's Encrypt certificates..."

# Build domain arguments
domain_args=""
for domain in "${domains[@]}"; do
    domain_args="$domain_args -d $domain"
done

# Set staging flag
staging_arg=""
if [ $staging != "0" ]; then
    staging_arg="--staging"
    echo "  (Using staging server)"
fi

$docker_compose -f docker-compose.production.yml run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    --email $email \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    $domain_args" certbot

# Reload nginx with real certificates
echo "Reloading nginx..."
$docker_compose -f docker-compose.production.yml exec nginx nginx -s reload

echo ""
echo "### SSL Certificate Setup Complete ###"
echo ""
echo "Certificates installed for:"
for domain in "${domains[@]}"; do
    echo "  - $domain"
done
echo ""
echo "Next steps:"
echo "1. Start the full stack: docker compose -f docker-compose.production.yml up -d"
echo "2. Run migrations: docker compose -f docker-compose.production.yml --profile migrate up migrate"
echo "3. Seed database: docker compose -f docker-compose.production.yml --profile seed up seed"
