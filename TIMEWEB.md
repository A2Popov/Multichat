# 🚀 Деплой MultiChat на Timeweb Cloud

Полное руководство по развертыванию MultiChat на виртуальном сервере Timeweb.

## 📋 Содержание

1. [Подготовка](#подготовка)
2. [Быстрый старт](#быстрый-старт)
3. [Ручная установка](#ручная-установка)
4. [Настройка домена](#настройка-домена)
5. [SSL сертификат](#ssl-сертификат)
6. [Обслуживание](#обслуживание)
7. [Решение проблем](#решение-проблем)

---

## 📦 Подготовка

### Выбор тарифа на Timeweb

#### Минимальный (для тестов)
- **Конфигурация:** START-1
- **CPU:** 1 vCore
- **RAM:** 1 GB
- **SSD:** 10 GB
- **Цена:** ~200₽/мес
- **Подходит для:** 1-5 пользователей, тестирование

#### Рекомендуемый (production)
- **Конфигурация:** START-2 или START-3
- **CPU:** 2-4 vCore
- **RAM:** 2-4 GB
- **SSD:** 20-40 GB
- **Цена:** ~400-800₽/мес
- **Подходит для:** 10-50 пользователей, стабильная работа

#### Расширенный (высокая нагрузка)
- **Конфигурация:** START-4+
- **CPU:** 4-8 vCore
- **RAM:** 8-16 GB
- **SSD:** 80-160 GB
- **Цена:** от 1500₽/мес
- **Подходит для:** 100+ пользователей, корпоративное использование

### Создание VPS

1. Войдите в панель управления Timeweb: https://timeweb.cloud
2. Перейдите в раздел **"Облачные серверы"**
3. Нажмите **"Создать сервер"**
4. Выберите:
   - **ОС:** Ubuntu 22.04 LTS
   - **Регион:** Москва или Санкт-Петербург (меньше задержки)
   - **Тариф:** Согласно вашим потребностям
   - **SSH ключ:** Добавьте свой публичный ключ (рекомендуется)
5. Дождитесь создания сервера (2-5 минут)
6. Скопируйте **IP адрес** сервера

### Подключение к серверу

```bash
# Если используете SSH ключ
ssh root@YOUR_SERVER_IP

# Если используете пароль (придет на email)
ssh root@YOUR_SERVER_IP
# Введите пароль при запросе
```

---

## ⚡ Быстрый старт (Автоматическая установка)

### Шаг 1: Загрузка скрипта установки

```bash
# Обновите систему
apt update && apt upgrade -y

# Установите git
apt install git -y

# Скачайте скрипт установки
cd /tmp
wget https://raw.githubusercontent.com/A2Popov/Multichat/main/deploy.sh
chmod +x deploy.sh

# Или клонируйте весь репозиторий
git clone https://github.com/A2Popov/Multichat.git /opt/multichat
cd /opt/multichat
chmod +x deploy.sh
```

### Шаг 2: Автоматическая установка

```bash
# Запустите установку (займет 10-15 минут)
./deploy.sh install
```

Скрипт автоматически:
- ✅ Установит Python 3.11, Node.js 20, PostgreSQL
- ✅ Настроит базу данных
- ✅ Установит зависимости backend и frontend
- ✅ Настроит Nginx
- ✅ Создаст systemd/supervisor сервисы
- ✅ Запустит приложение

### Шаг 3: Настройка API ключей

```bash
# Отредактируйте конфигурацию
nano /opt/multichat/.env

# Минимально необходимые настройки:
# 1. Измените SECRET_KEY (генерация: openssl rand -hex 32)
# 2. Добавьте хотя бы один API ключ (OPENAI_API_KEY или другой)
# 3. Измените пароль DATABASE_URL (замените changeme_prod_password)
```

### Шаг 4: Перезапустите сервис

```bash
./deploy.sh restart
```

### Шаг 5: Проверка работы

```bash
# Проверьте статус
./deploy.sh status

# Проверьте логи
./deploy.sh logs

# Откройте в браузере
# http://YOUR_SERVER_IP
```

**🎉 Готово! MultiChat доступен по IP адресу вашего сервера.**

---

## 🔧 Ручная установка (пошагово)

Если предпочитаете контролировать каждый шаг:

### 1. Установка системных зависимостей

```bash
# Обновление системы
apt update && apt upgrade -y

# Python 3.11
apt install -y software-properties-common
add-apt-repository -y ppa:deadsnakes/ppa
apt update
apt install -y python3.11 python3.11-venv python3.11-dev python3-pip

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Nginx, Git, Certbot
apt install -y nginx git certbot python3-certbot-nginx

# PostgreSQL
apt install -y postgresql postgresql-contrib

# Tesseract OCR (для распознавания текста на изображениях)
apt install -y tesseract-ocr tesseract-ocr-rus tesseract-ocr-eng

# Supervisor (для управления процессами)
apt install -y supervisor
```

### 2. Настройка PostgreSQL

```bash
# Войдите в PostgreSQL
sudo -u postgres psql

# Выполните SQL команды:
```

```sql
CREATE DATABASE multichat;
CREATE USER multichat_user WITH PASSWORD 'your_strong_password_here';
ALTER DATABASE multichat OWNER TO multichat_user;
GRANT ALL PRIVILEGES ON DATABASE multichat TO multichat_user;
\q
```

### 3. Клонирование репозитория

```bash
cd /opt
git clone https://github.com/A2Popov/Multichat.git multichat
cd multichat
```

### 4. Настройка Backend

```bash
cd /opt/multichat/backend

# Создайте виртуальное окружение
python3.11 -m venv venv
source venv/bin/activate

# Установите зависимости
pip install --upgrade pip
pip install -r requirements.txt
pip install psycopg2-binary gunicorn
```

### 5. Настройка конфигурации

```bash
cd /opt/multichat

# Создайте .env файл
cp .env.production .env
nano .env

# Обязательно измените:
# - SECRET_KEY (сгенерируйте: openssl rand -hex 32)
# - DATABASE_URL (замените пароль на тот, что указали в PostgreSQL)
# - Добавьте хотя бы один API ключ (OPENAI_API_KEY, ANTHROPIC_API_KEY и т.д.)
```

### 6. Инициализация базы данных

```bash
cd /opt/multichat/backend
source venv/bin/activate
python init_admin.py

# Запомните логин и пароль администратора (admin / admin123)
```

### 7. Сборка Frontend

```bash
cd /opt/multichat/frontend

# Установите зависимости
npm install

# Соберите production версию
npm run build

# Результат будет в /opt/multichat/frontend/dist
```

### 8. Настройка Nginx

```bash
# Создайте конфигурацию
nano /etc/nginx/sites-available/multichat
```

Вставьте конфигурацию:

```nginx
server {
    listen 80;
    server_name YOUR_SERVER_IP;  # Или ваш домен
    
    client_max_body_size 10M;
    
    # Frontend
    location / {
        root /opt/multichat/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static files
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
    
    # Backend documentation
    location ~ ^/(docs|redoc|openapi.json) {
        proxy_pass http://127.0.0.1:8008;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Активируйте конфигурацию
ln -s /etc/nginx/sites-available/multichat /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Проверьте конфигурацию
nginx -t

# Перезапустите Nginx
systemctl restart nginx
systemctl enable nginx
```

### 9. Настройка systemd сервиса

```bash
# Создайте лог директорию
mkdir -p /var/log/multichat

# Скопируйте systemd сервис
cp /opt/multichat/multichat.service /etc/systemd/system/

# Обновите systemd
systemctl daemon-reload

# Запустите сервис
systemctl start multichat
systemctl enable multichat

# Проверьте статус
systemctl status multichat
```

### 10. Проверка работы

```bash
# Проверьте логи
journalctl -u multichat -f

# Или
tail -f /var/log/multichat/error.log

# Откройте в браузере
# http://YOUR_SERVER_IP
```

---

## 🌐 Настройка домена

### В панели Timeweb

1. Перейдите в **"Домены"**
2. Если домена нет - купите или делегируйте существующий
3. В настройках DNS добавьте A-запись:
   - **Тип:** A
   - **Имя:** @ (или оставьте пустым)
   - **Значение:** IP вашего сервера
   - **TTL:** 3600
4. Добавьте еще одну A-запись для www:
   - **Тип:** A
   - **Имя:** www
   - **Значение:** IP вашего сервера
   - **TTL:** 3600

### На сервере

```bash
# Обновите Nginx конфигурацию
nano /etc/nginx/sites-available/multichat

# Замените YOUR_SERVER_IP на ваш домен:
server_name your-domain.com www.your-domain.com;

# Перезапустите Nginx
nginx -t && systemctl reload nginx
```

**Подождите 10-30 минут** пока DNS записи распространятся.

---

## 🔒 SSL сертификат (HTTPS)

### Автоматическая установка с Certbot

```bash
# Установите SSL сертификат
certbot --nginx -d your-domain.com -d www.your-domain.com

# Следуйте инструкциям:
# 1. Введите email для уведомлений
# 2. Согласитесь с условиями (Y)
# 3. Опционально: согласитесь на рассылку (N/Y)
# 4. Выберите: 2 (Redirect) - автоматическое перенаправление на HTTPS

# Настройте автообновление
systemctl enable certbot.timer
systemctl start certbot.timer

# Проверьте автообновление
certbot renew --dry-run
```

Теперь ваш сайт доступен по **https://your-domain.com** 🔐

---

## 🛠️ Обслуживание

### Обновление приложения

```bash
cd /opt/multichat

# Обновите код из Git
git pull

# Обновите зависимости backend
cd backend
source venv/bin/activate
pip install --upgrade -r requirements.txt

# Пересоберите frontend
cd ../frontend
npm install
npm run build

# Перезапустите сервис
systemctl restart multichat
systemctl reload nginx
```

Или используйте скрипт:

```bash
/opt/multichat/deploy.sh update
```

### Просмотр логов

```bash
# Backend логи (systemd)
journalctl -u multichat -f

# Backend логи (файлы)
tail -f /var/log/multichat/error.log
tail -f /var/log/multichat/access.log

# Nginx логи
tail -f /var/nginx/error.log
tail -f /var/nginx/access.log
```

### Перезапуск сервисов

```bash
# Перезапуск backend
systemctl restart multichat

# Перезапуск Nginx
systemctl reload nginx

# Проверка статуса
systemctl status multichat
systemctl status nginx
```

### Резервное копирование

```bash
# Создайте скрипт backup
nano /root/backup-multichat.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/backups/multichat"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
sudo -u postgres pg_dump multichat > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/multichat/backend/uploads

# Backup .env
cp /opt/multichat/.env $BACKUP_DIR/env_$DATE

# Keep only last 7 backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
chmod +x /root/backup-multichat.sh

# Добавьте в cron (ежедневно в 3:00)
crontab -e
# Добавьте строку:
0 3 * * * /root/backup-multichat.sh >> /var/log/multichat-backup.log 2>&1
```

---

## 🐛 Решение проблем

### Backend не запускается

```bash
# Проверьте логи
journalctl -u multichat -n 50

# Проверьте .env файл
cat /opt/multichat/.env | grep -v "^#" | grep -v "^$"

# Проверьте доступность порта
netstat -tulpn | grep 8008

# Попробуйте запустить вручную
cd /opt/multichat/backend
source venv/bin/activate
python -c "from app.main import app; print('OK')"
```

### Ошибка подключения к базе данных

```bash
# Проверьте PostgreSQL
systemctl status postgresql

# Проверьте подключение
sudo -u postgres psql -c "SELECT version();"

# Проверьте пароль в .env
grep DATABASE_URL /opt/multichat/.env

# Пересоздайте пользователя если нужно
sudo -u postgres psql
DROP DATABASE IF EXISTS multichat;
DROP USER IF EXISTS multichat_user;
CREATE DATABASE multichat;
CREATE USER multichat_user WITH PASSWORD 'new_password';
ALTER DATABASE multichat OWNER TO multichat_user;
GRANT ALL PRIVILEGES ON DATABASE multichat TO multichat_user;
\q
```

### Nginx показывает 502 Bad Gateway

```bash
# Backend не запущен или недоступен
systemctl status multichat
systemctl start multichat

# Проверьте порт backend
curl http://127.0.0.1:8008/health

# Проверьте логи Nginx
tail -f /var/log/nginx/error.log
```

### Не работает загрузка файлов

```bash
# Проверьте разрешения
chown -R root:root /opt/multichat/backend/uploads
chmod -R 755 /opt/multichat/backend/uploads

# Проверьте Tesseract (для OCR)
tesseract --version
apt install -y tesseract-ocr tesseract-ocr-rus
```

### Высокое использование памяти

```bash
# Уменьшите количество workers в systemd сервисе
nano /etc/systemd/system/multichat.service
# Измените --workers 4 на --workers 2

systemctl daemon-reload
systemctl restart multichat

# Или в .env
echo "WORKERS=2" >> /opt/multichat/.env
```

### SSL сертификат не продлевается

```bash
# Проверьте таймер certbot
systemctl status certbot.timer

# Проверьте вручную
certbot renew --dry-run

# Если ошибка - пересоздайте
certbot delete --cert-name your-domain.com
certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

## 📊 Мониторинг

### Установка мониторинга (опционально)

```bash
# Установите htop для мониторинга ресурсов
apt install htop -y
htop

# Установите netdata для веб-мониторинга
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
# Доступ: http://YOUR_SERVER_IP:19999
```

### Проверка производительности

```bash
# Использование CPU и памяти
top
htop

# Использование диска
df -h
du -sh /opt/multichat/*

# Сетевая активность
iftop
nethogs

# Количество подключений
netstat -an | grep :8008 | wc -l
```

---

## 🔧 Настройка firewall (опционально)

```bash
# Установите ufw
apt install ufw -y

# Разрешите SSH
ufw allow 22/tcp

# Разрешите HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Включите firewall
ufw enable

# Проверьте статус
ufw status
```

---

## 📞 Полезные команды

```bash
# Быстрая диагностика
/opt/multichat/deploy.sh status

# Перезапуск всего
systemctl restart multichat nginx

# Просмотр логов в реальном времени
journalctl -u multichat -f

# Проверка дискового пространства
df -h

# Проверка использования памяти
free -h

# Список процессов Python
ps aux | grep python

# Проверка портов
netstat -tulpn | grep -E ':(80|443|8008)'

# Проверка доступности API
curl http://127.0.0.1:8008/health

# Проверка версии
cd /opt/multichat && git log -1 --oneline
```

---

## 🎓 Дополнительные материалы

- [Документация Timeweb](https://timeweb.cloud/help)
- [Nginx документация](https://nginx.org/ru/docs/)
- [Certbot документация](https://certbot.eff.org/)
- [PostgreSQL документация](https://www.postgresql.org/docs/)
- [Supervisor документация](http://supervisord.org/)

---

## 💬 Поддержка

При возникновении проблем:

1. Проверьте логи: `journalctl -u multichat -n 100`
2. Проверьте статус: `systemctl status multichat nginx`
3. Создайте Issue на GitHub с описанием проблемы и логами

---

**Успешного деплоя! 🚀**
