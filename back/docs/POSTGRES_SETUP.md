# Настройка PostgreSQL для Django

## Шаг 1: Исправление пользователя PostgreSQL

Запусти скрипт для создания пользователя и базы данных:

```bash
cd /home/batyr/projects/LanG/back
./fix_postgres.sh
```

**Или вручную:**

```bash
sudo -u postgres psql
```

В psql выполни:

```sql
DROP DATABASE IF EXISTS lang_db;
DROP USER IF EXISTS lang_user;
CREATE USER lang_user WITH PASSWORD 'lang_password';
CREATE DATABASE lang_db OWNER lang_user;
GRANT ALL PRIVILEGES ON DATABASE lang_db TO lang_user;
ALTER USER lang_user CREATEDB;
\q
```

## Шаг 2: Проверка подключения

```bash
cd /home/batyr/projects/LanG/back
source venv/bin/activate
python manage.py check --database default
```

## Шаг 3: Выполнение миграций

```bash
python manage.py migrate
```

## Шаг 4: Перенос данных из SQLite (если нужно)

### Вариант 1: Автоматический (скрипт)

```bash
python migrate_sqlite_to_postgres.py
```

### Вариант 2: Вручную

```bash
# 1. Создать дамп из SQLite
USE_POSTGRES=False python manage.py dumpdata --exclude=contenttypes --exclude=auth.permission --exclude=sessions > sqlite_dump.json

# 2. Загрузить в PostgreSQL
USE_POSTGRES=True python manage.py loaddata sqlite_dump.json
```

## Шаг 5: Создание суперпользователя (если нужно)

```bash
python manage.py createsuperuser
```

## Шаг 6: Обновление chat-service

После настройки PostgreSQL, обнови `.env` в `chat-service`:

```env
DATABASE_URL=postgresql://lang_user:lang_password@localhost:5432/lang_db
```

## Проверка

```bash
# Проверка подключения Django
python manage.py dbshell

# Проверка таблиц
python manage.py showmigrations
```

