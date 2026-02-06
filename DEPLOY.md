# Деплой MultiChat на Timeweb Cloud

## Рекомендуемая конфигурация VPS

### Минимальная (для тестирования)
- **CPU:** 1 vCPU
- **RAM:** 1 GB
- **Диск:** 10 GB SSD
- **Цена:** ~200₽/мес
- **Подходит для:** Личное использование, низкая нагрузка

### Оптимальная (рекомендуется)
- **CPU:** 2 vCPU
- **RAM:** 2-4 GB
- **Диск:** 20-40 GB SSD
- **Цена:** ~400-600₽/мес
- **Подходит для:** Малый/средний бизнес, множество пользователей

### Расширенная (высокая нагрузка)
- **CPU:** 4 vCPU
- **RAM:** 8 GB
- **Диск:** 80 GB SSD
- **Цена:** ~1200₽/мес
- **Подходит для:** Высокая нагрузка, корпоративное использование

## Подготовка сервера

### 1. Создание VPS на Timeweb
```bash
# OS: Ubuntu 22.04 LTS
# Выберите конфигурацию и регион
# После создания получите IP адрес
```

### 2. Подключение к серверу
```bash
ssh root@your-server-ip
```

### 3. Обновление системы
```bash
apt update && apt upgrade -y
```

### 4. Установка необходимого ПО
```bash
# Python 3.11+
apt install python3.11 python3.11-venv python3-pip -y

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install nodejs -y

# Nginx
apt install nginx -y

# PostgreSQL (вместо SQLite для продакшена)
apt install postgresql postgresql-contrib -y

# Supervisor (для автозапуска)
apt install supervisor -y

# Certbot (для SSL)
apt install certbot python3-certbot-nginx -y
```

## Настройка базы данных PostgreSQL

```bash
# Войти в PostgreSQL
sudo -u postgres psql

# Создать базу и пользователя
CREATE DATABASE multichat;
CREATE USER multichat_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE multichat TO multichat_user;
\q
```

## Деплой приложения

### 1. Клонирование репозитория
```bash
cd /opt
git clone git@github.com:A2Popov/Multichat.git
cd Multichat
```

### 2. Настройка Backend

```bash
cd backend

# Создать виртуальное окружение
python3.11 -m venv venv
source venv/bin/activate

# Установить зависимости
pip install -r requirements.txt
pip install psycopg2-binary  # для PostgreSQL

# Создать .env файл
nano .env
```

**Содержимое .env:**
```env
# Security
SECRET_KEY=вашкриптостойкийключминимум32символа

# Database
DATABASE_URL=postgresql://multichat_user:your_strong_password@localhost/multichat

# AI Provider API Keys
OPENAI_API_KEY=ваш_ключ
ANTHROPIC_API_KEY=ваш_ключ
GOOGLE_API_KEY=ваш_ключ
TOGETHER_API_KEY=ваш_ключ

# CORS (ваш домен)
ALLOWED_ORIGINS=["https://yourdomain.com"]
```

```bash
# Обновить настройки для PostgreSQL
nano app/config/settings.py
# Изменить DATABASE_URL на использование переменной из .env

# Создать таблицы
python init_admin.py
```

### 3. Настройка Frontend

```bash
cd ../frontend

# Установить зависимости
npm install

# Сборка для продакшена
npm run build
# Результат в dist/
```

### 4. Настройка Nginx

```bash
nano /etc/nginx/sites-available/multichat
```

**Конфигурация Nginx:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (статика)
    location / {
        root /opt/Multichat/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket поддержка (если понадобится)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Логи
    access_log /var/log/nginx/multichat_access.log;
    error_log /var/log/nginx/multichat_error.log;
}
```

```bash
# Активировать конфигурацию
ln -s /etc/nginx/sites-available/multichat /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 5. Настройка Supervisor (автозапуск Backend)

```bash
nano /etc/supervisor/conf.d/multichat.conf
```

**Конфигурация Supervisor:**
```ini
[program:multichat]
directory=/opt/Multichat/backend
command=/opt/Multichat/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 2
user=root
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/multichat.log
environment=PYTHONPATH="/opt/Multichat/backend"
```

```bash
# Применить конфигурацию
supervisorctl reread
supervisorctl update
supervisorctl start multichat

# Проверить статус
supervisorctl status multichat
```

### 6. Настройка SSL (HTTPS)

```bash
# Получить SSL сертификат от Let's Encrypt
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Автопродление (уже настроено автоматически)
certbot renew --dry-run
```

## Настройка домена

1. В панели управления доменом добавьте A-запись:
   - Имя: `@` (или `www`)
   - Тип: `A`
   - Значение: IP адрес вашего VPS

2. Дождитесь распространения DNS (до 24 часов, обычно 1-2 часа)

## Мониторинг и логи

```bash
# Логи Backend
tail -f /var/log/multichat.log

# Логи Nginx
tail -f /var/log/nginx/multichat_access.log
tail -f /var/log/nginx/multichat_error.log

# Статус сервисов
supervisorctl status
systemctl status nginx
systemctl status postgresql
```

## Безопасность

### 1. Firewall
```bash
# Установить UFW
apt install ufw -y

# Разрешить SSH, HTTP, HTTPS
ufw allow 22
ufw allow 80
ufw allow 443

# Включить firewall
ufw enable
```

### 2. SSH ключи (вместо пароля)
```bash
# На локальной машине
ssh-keygen -t rsa -b 4096

# Скопировать ключ на сервер
ssh-copy-id root@your-server-ip

# Отключить вход по паролю
nano /etc/ssh/sshd_config
# PasswordAuthentication no
systemctl restart ssh
```

### 3. Регулярные обновления
```bash
# Автоматические обновления безопасности
apt install unattended-upgrades -y
dpkg-reconfigure --priority=low unattended-upgrades
```

## Бэкапы

### 1. Бэкап базы данных
```bash
# Создать скрипт бэкапа
nano /opt/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Бэкап PostgreSQL
pg_dump -U multichat_user multichat > $BACKUP_DIR/multichat_$DATE.sql

# Удалить старые бэкапы (старше 7 дней)
find $BACKUP_DIR -name "*.sql" -type f -mtime +7 -delete
```

```bash
chmod +x /opt/backup-db.sh

# Добавить в cron (ежедневно в 3:00)
crontab -e
0 3 * * * /opt/backup-db.sh
```

## Обновление приложения

```bash
cd /opt/Multichat

# Остановить backend
supervisorctl stop multichat

# Получить изменения
git pull

# Обновить backend
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Обновить frontend
cd ../frontend
npm install
npm run build

# Запустить backend
supervisorctl start multichat

# Перезагрузить nginx
systemctl reload nginx
```

## Масштабирование

### Увеличение производительности
1. **Больше uvicorn workers:**
   ```bash
   # В supervisor конфигурации
   --workers 4  # По количеству CPU ядер
   ```

2. **Redis для кэширования:**
   ```bash
   apt install redis-server -y
   pip install redis
   ```

3. **CDN для статики:**
   - Использовать Cloudflare или аналог
   - Кэширование статических файлов

4. **Балансировка нагрузки:**
   - Nginx upstream для нескольких backend инстансов
   - Несколько VPS за load balancer

## Мониторинг производительности

```bash
# Установить htop для мониторинга ресурсов
apt install htop -y

# Мониторинг в реальном времени
htop

# Проверка использования диска
df -h

# Использование памяти
free -h
```

## Стоимость (примерная)

- **VPS 2 vCPU, 2GB RAM:** 400₽/мес
- **Домен .ru/.com:** 200-800₽/год
- **SSL сертификат:** Бесплатно (Let's Encrypt)
- **Бэкапы (опционально):** 100-200₽/мес

**Итого:** ~500-600₽/мес + домен

## Поддержка

При возникновении проблем:
1. Проверьте логи (см. раздел "Мониторинг и логи")
2. Убедитесь что все сервисы запущены
3. Проверьте firewall правила
4. Убедитесь что API ключи действительны

---

**Примечание:** Для высоконагруженных систем рекомендуется использовать managed PostgreSQL, Redis и CDN от Timeweb.
