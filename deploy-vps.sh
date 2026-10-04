#!/usr/bin/env bash
# ==============================================================================
# Class Accounting Management System (CAMS) - 1-Click Contabo VPS Deployer
# Usage:
#   sudo bash deploy-vps.sh portal.yourdomain.com
# ==============================================================================

set -e

DOMAIN="$1"
REPO_URL="https://github.com/snilanga2009-beep/Eclass.git"
APP_DIR="/var/www/my-class"
NODE_PORT=5000

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================================================${NC}"
echo -e "${GREEN}   Apex Class Accounting Management System (CAMS) VPS Deployer     ${NC}"
echo -e "${BLUE}==================================================================${NC}"

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Error: Domain or Subdomain argument is required.${NC}"
    echo -e "${YELLOW}Usage: sudo bash deploy-vps.sh <subdomain.yourdomain.com>${NC}"
    echo -e "Example: sudo bash deploy-vps.sh portal.apexclass.lk"
    exit 1
fi

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: Please run as root (or use sudo).${NC}"
    exit 1
fi

echo -e "\n${BLUE}>>> [1/7] Updating Ubuntu packages and installing base tools...${NC}"
apt-get update -y
apt-get install -y curl git nginx certbot python3-certbot-nginx ufw software-properties-common

echo -e "\n${BLUE}>>> [2/7] Checking and installing Node.js 20 LTS...${NC}"
NEED_NODE=false
if ! command -v node >/dev/null 2>&1; then
    NEED_NODE=true
else
    NODE_MAJOR=$(node -v | cut -d'.' -f1 | tr -d 'v')
    if [ "$NODE_MAJOR" -lt 18 ]; then
        NEED_NODE=true
    fi
fi

if [ "$NEED_NODE" = true ]; then
    echo -e "${YELLOW}Installing Node.js 20 LTS from NodeSource...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo -e "${GREEN}Node.js Version: $(node -v)${NC}"
echo -e "${GREEN}NPM Version:     $(npm -v)${NC}"

# Install PM2 globally
if ! command -v pm2 >/dev/null 2>&1; then
    echo -e "${YELLOW}Installing PM2 Process Manager...${NC}"
    npm install -g pm2
fi

echo -e "\n${BLUE}>>> [3/7] Setting up application repository at ${APP_DIR}...${NC}"
mkdir -p "$APP_DIR"

if [ -d "$APP_DIR/.git" ]; then
    echo -e "${YELLOW}Existing repository found. Pulling latest updates from GitHub...${NC}"
    cd "$APP_DIR"
    git reset --hard HEAD
    git pull origin main
else
    echo -e "${YELLOW}Cloning repository from GitHub...${NC}"
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# Ensure storage directories exist with proper write permissions
mkdir -p "$APP_DIR/server/data"
mkdir -p "$APP_DIR/server/uploads"
chmod -R 775 "$APP_DIR/server/data"
chmod -R 775 "$APP_DIR/server/uploads"

echo -e "\n${BLUE}>>> [4/7] Installing dependencies & building production bundle...${NC}"
cd "$APP_DIR"

# Install all packages (Root + Server + Client)
npm run install:all

# Build Client SPA & Server
echo -e "${YELLOW}Building Client Web App (Vite & PWA)...${NC}"
node build.cjs

echo -e "${YELLOW}Compiling Backend TypeScript...${NC}"
npm --prefix server run build

echo -e "\n${BLUE}>>> [5/7] Starting application with PM2 daemon...${NC}"
# Stop any existing PM2 instance with this name
pm2 delete cams-app >/dev/null 2>&1 || true

# Start backend using PM2
pm2 start server/dist/index.js --name "cams-app"
pm2 save

# Setup startup script for automatic boot on system restart
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

echo -e "\n${BLUE}>>> [6/7] Configuring Nginx reverse proxy for ${DOMAIN}...${NC}"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

cat <<EOF > "$NGINX_CONF"
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 50M;

    # Gzip compression for maximum speed
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Static uploads folder
    location /uploads/ {
        alias $APP_DIR/server/uploads/;
        expires 30d;
        access_log off;
    }

    # Proxy all traffic to Node.js / Express (Port $NODE_PORT)
    location / {
        proxy_pass http://127.0.0.1:$NODE_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 90;
    }
}
EOF

# Enable site
ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$DOMAIN"

# Remove default site if present
rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
nginx -t
systemctl restart nginx

# Firewall setup
echo -e "\n${BLUE}>>> Setting up UFW firewall...${NC}"
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

echo -e "\n${BLUE}>>> [7/7] Obtaining SSL Certificate via Let's Encrypt Certbot...${NC}"
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" --redirect || {
    echo -e "${YELLOW}Warning: Certbot SSL was skipped or DNS is not yet pointed.${NC}"
    echo -e "${YELLOW}Make sure your A record points to this server IP, then run:${NC}"
    echo -e "${GREEN}  sudo certbot --nginx -d $DOMAIN${NC}"
}

echo -e "\n${GREEN}==================================================================${NC}"
echo -e "${GREEN}   🚀 Deployment Complete! CAMS is Live on Contabo VPS!         ${NC}"
echo -e "${GREEN}==================================================================${NC}"
echo -e "Access your application at:"
echo -e "${BLUE}  https://$DOMAIN${NC} (or http://$DOMAIN)"
echo -e ""
echo -e "PM2 Status Check:"
echo -e "  ${YELLOW}pm2 status${NC}"
echo -e "PM2 Live Logs:"
echo -e "  ${YELLOW}pm2 logs cams-app${NC}"
echo -e ""
echo -e "To update code in the future:"
echo -e "  ${YELLOW}cd /var/www/my-class && git pull && node build.cjs && npm --prefix server run build && pm2 restart cams-app${NC}"
echo -e "${GREEN}==================================================================${NC}"
