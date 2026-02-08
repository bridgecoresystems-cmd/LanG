#!/bin/bash
# Скрипт для настройки PostgreSQL для Django проекта

DB_NAME="lang_db"
DB_USER="lang_user"
DB_PASSWORD="lang_password"

echo "🔧 Настройка PostgreSQL для Django..."

# Создаем пользователя (если не существует)
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "Пользователь $DB_USER уже существует"

# Создаем базу данных (если не существует)
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "База данных $DB_NAME уже существует"

# Даем права пользователю
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "✅ PostgreSQL настроен!"
echo "База данных: $DB_NAME"
echo "Пользователь: $DB_USER"

