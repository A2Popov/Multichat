#!/bin/bash
# Quick Start Script для MultiChat на Timeweb
# Одна команда для полной установки

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🚀 MultiChat Quick Setup for Timeweb Cloud 🚀        ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Пожалуйста, запустите скрипт от имени root: sudo ./quick-start.sh"
    exit 1
fi

# Prompt for domain (optional)
read -p "📌 Ваш домен (оставьте пустым для использования IP): " DOMAIN

# Update system
echo "📦 Обновление системы..."
apt update -qq && apt upgrade -y -qq

# Install git
echo "📦 Установка Git..."
apt install -y git wget curl

# Clone repository
echo "📥 Клонирование репозитория..."
cd /opt
if [ -d "multichat" ]; then
    echo "⚠️  Директория /opt/multichat уже существует. Удаляю..."
    rm -rf multichat
fi
git clone https://github.com/A2Popov/Multichat.git multichat
cd multichat
chmod +x deploy.sh

# Run full installation
echo "🔧 Запуск автоматической установки..."
./deploy.sh install

# Setup domain if provided
if [ ! -z "$DOMAIN" ]; then
    echo "🌐 Настройка домена $DOMAIN..."
    sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/multichat
    nginx -t && systemctl reload nginx
    
    # Setup SSL
    read -p "🔒 Установить SSL сертификат для $DOMAIN? (y/n): " SETUP_SSL
    if [ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ]; then
        certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo "⚠️  Не удалось установить SSL. Попробуйте позже вручную."
    fi
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     ✅ Установка завершена успешно! ✅                   ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Следующие шаги:"
echo ""
echo "1️⃣  Настройте API ключи:"
echo "   nano /opt/multichat/.env"
echo "   (Добавьте OPENAI_API_KEY или другие ключи)"
echo ""
echo "2️⃣  Измените пароль БД в .env:"
echo "   DATABASE_URL=postgresql://multichat_user:ВАШ_ПАРОЛЬ@localhost/multichat"
echo ""
echo "3️⃣  Перезапустите сервис:"
echo "   /opt/multichat/deploy.sh restart"
echo ""
if [ -z "$DOMAIN" ]; then
    SERVER_IP=$(curl -s ifconfig.me)
    echo "🌍 Приложение доступно по адресу:"
    echo "   http://$SERVER_IP"
else
    if [ "$SETUP_SSL" = "y" ] || [ "$SETUP_SSL" = "Y" ]; then
        echo "🌍 Приложение доступно по адресу:"
        echo "   https://$DOMAIN"
    else
        echo "🌍 Приложение доступно по адресу:"
        echo "   http://$DOMAIN"
    fi
fi
echo ""
echo "👤 Логин по умолчанию:"
echo "   Username: admin"
echo "   Password: admin123"
echo "   ⚠️  Измените пароль после первого входа!"
echo ""
echo "📚 Полная документация: /opt/multichat/TIMEWEB.md"
echo "🔧 Управление: /opt/multichat/deploy.sh --help"
echo ""
