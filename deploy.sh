#!/bin/bash

# MultiChat Deployment Script for Timeweb
# Usage: ./deploy.sh [install|update|restart|stop|logs]

set -e

INSTALL_DIR="/opt/multichat"
BACKEND_DIR="$INSTALL_DIR/backend"
FRONTEND_DIR="$INSTALL_DIR/frontend"
DOMAIN="your-domain.com"  # Замените на ваш домен

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo_success() {
    echo -e "${GREEN}✓${NC} $1"
}

echo_error() {
    echo -e "${RED}✗${NC} $1"
}

echo_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

install_system_deps() {
    echo_info "Установка системных зависимостей..."
    
    # Update system
    apt update && apt upgrade -y
    
    # Install Python 3.11
    apt install -y software-properties-common
    add-apt-repository -y ppa:deadsnakes/ppa
    apt update
    apt install -y python3.11 python3.11-venv python3.11-dev python3-pip
    
    # Install Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # Install other dependencies
    apt install -y nginx supervisor git certbot python3-certbot-nginx
    apt install -y tesseract-ocr tesseract-ocr-rus  # для OCR
    apt install -y postgresql postgresql-contrib
    
    echo_success "Системные зависимости установлены"
}

setup_database() {
    echo_info "Настройка PostgreSQL..."
    
    # Проверка существования базы
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw multichat; then
        echo_warning "База данных multichat уже существует"
    else
        sudo -u postgres psql << EOF
CREATE DATABASE multichat;
CREATE USER multichat_user WITH PASSWORD 'changeme_prod_password';
ALTER DATABASE multichat OWNER TO multichat_user;
GRANT ALL PRIVILEGES ON DATABASE multichat TO multichat_user;
EOF
        echo_success "База данных создана"
        echo_warning "⚠️  Не забудьте изменить пароль в /opt/multichat/.env"
    fi
}

install_app() {
    echo_info "Установка MultiChat..."
    
    # Create directory
    mkdir -p $INSTALL_DIR
    cd /opt
    
    # Clone repository
    if [ -d "$INSTALL_DIR/.git" ]; then
        echo_warning "Репозиторий уже существует, обновляю..."
        cd $INSTALL_DIR
        git pull
    else
        if [ -d "$INSTALL_DIR" ]; then
            rm -rf $INSTALL_DIR
        fi
        git clone https://github.com/A2Popov/Multichat.git multichat
        cd $INSTALL_DIR
    fi
    
    # Setup backend
    echo_info "Настройка Backend..."
    cd $BACKEND_DIR
    python3.11 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    pip install psycopg2-binary gunicorn
    
    # Create .env if not exists
    if [ ! -f "$INSTALL_DIR/.env" ]; then
        cp $INSTALL_DIR/.env.example $INSTALL_DIR/.env
        echo_warning "⚠️  Создан файл .env - заполните API ключи!"
    fi
    
    # Initialize database
    python init_admin.py
    
    # Setup frontend
    echo_info "Настройка Frontend..."
    cd $FRONTEND_DIR
    npm install
    npm run build
    
    echo_success "Приложение установлено"
}

setup_nginx() {
    echo_info "Настройка Nginx..."
    
    # Backup old config
    if [ -f "/etc/nginx/sites-available/multichat" ]; then
        cp /etc/nginx/sites-available/multichat /etc/nginx/sites-available/multichat.backup
    fi
    
    # Create Nginx config
    cat > /etc/nginx/sites-available/multichat << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    client_max_body_size 10M;
    
    # Frontend
    location / {
        root /opt/multichat/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Backend docs
    location /docs {
        proxy_pass http://127.0.0.1:8008/docs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /redoc {
        proxy_pass http://127.0.0.1:8008/redoc;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
    
    # Replace domain
    sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/multichat
    
    # Enable site
    ln -sf /etc/nginx/sites-available/multichat /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test and reload
    nginx -t && systemctl reload nginx
    
    echo_success "Nginx настроен"
}

setup_supervisor() {
    echo_info "Настройка Supervisor..."
    
    cat > /etc/supervisor/conf.d/multichat.conf << 'EOF'
[program:multichat-backend]
directory=/opt/multichat/backend
command=/opt/multichat/backend/venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8008 --timeout 300
user=root
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/multichat/backend.log
stderr_logfile=/var/log/multichat/backend.error.log
environment=PATH="/opt/multichat/backend/venv/bin"
EOF
    
    # Create log directory
    mkdir -p /var/log/multichat
    
    # Reload supervisor
    supervisorctl reread
    supervisorctl update
    
    echo_success "Supervisor настроен"
}

setup_ssl() {
    echo_info "Настройка SSL сертификата..."
    
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # Auto-renewal
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    echo_success "SSL сертификат установлен"
}

update_app() {
    echo_info "Обновление приложения..."
    
    cd $INSTALL_DIR
    git pull
    
    # Update backend
    cd $BACKEND_DIR
    source venv/bin/activate
    pip install --upgrade -r requirements.txt
    
    # Update frontend
    cd $FRONTEND_DIR
    npm install
    npm run build
    
    # Restart services
    supervisorctl restart multichat-backend
    systemctl reload nginx
    
    echo_success "Приложение обновлено"
}

restart_services() {
    echo_info "Перезапуск сервисов..."
    
    supervisorctl restart multichat-backend
    systemctl reload nginx
    
    echo_success "Сервисы перезапущены"
}

stop_services() {
    echo_info "Остановка сервисов..."
    
    supervisorctl stop multichat-backend
    
    echo_success "Сервисы остановлены"
}

show_logs() {
    echo_info "Логи Backend:"
    tail -f /var/log/multichat/backend.log
}

show_status() {
    echo_info "Статус сервисов:"
    supervisorctl status multichat-backend
    systemctl status nginx --no-pager
}

# Main script logic
case "$1" in
    install)
        echo_info "Начало установки MultiChat..."
        install_system_deps
        setup_database
        install_app
        setup_nginx
        setup_supervisor
        echo ""
        echo_success "✅ Установка завершена!"
        echo ""
        echo_info "Следующие шаги:"
        echo "1. Отредактируйте /opt/multichat/.env и добавьте API ключи"
        echo "2. Измените пароль базы данных в .env"
        echo "3. Настройте домен: DOMAIN=\"your-domain.com\" в deploy.sh"
        echo "4. Запустите: ./deploy.sh ssl"
        echo "5. Проверьте статус: ./deploy.sh status"
        ;;
        
    ssl)
        echo_info "Установка SSL..."
        read -p "Введите ваш домен: " DOMAIN
        sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/multichat
        setup_ssl
        ;;
        
    update)
        update_app
        ;;
        
    restart)
        restart_services
        ;;
        
    stop)
        stop_services
        ;;
        
    logs)
        show_logs
        ;;
        
    status)
        show_status
        ;;
        
    *)
        echo "Использование: $0 {install|update|restart|stop|logs|status|ssl}"
        echo ""
        echo "Команды:"
        echo "  install  - Полная установка на чистый сервер"
        echo "  update   - Обновление приложения из Git"
        echo "  restart  - Перезапуск всех сервисов"
        echo "  stop     - Остановка всех сервисов"
        echo "  logs     - Просмотр логов в реальном времени"
        echo "  status   - Проверка статуса сервисов"
        echo "  ssl      - Установка SSL сертификата"
        exit 1
        ;;
esac

exit 0
