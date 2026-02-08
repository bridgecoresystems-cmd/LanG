#!/bin/bash
# Скрипт для исправления настроек PostgreSQL

DB_NAME="lang_db"
DB_USER="lang_user"
DB_PASSWORD="lang_password"

echo "🔧 Исправление настроек PostgreSQL..."

# Удаляем старые пользователя и базу (если нужно)
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null
sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null

# Создаем нового пользователя с правильным паролем
sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"

# Создаем базу данных
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Даем все права
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"

echo "✅ PostgreSQL настроен!"
echo "База данных: $DB_NAME"
echo "Пользователь: $DB_USER"
echo "Пароль: $DB_PASSWORD"

