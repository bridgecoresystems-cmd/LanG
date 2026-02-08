# Инструкция по настройке PostgreSQL

## ✅ Что уже сделано:

1. ✅ PostgreSQL установлен и работает
2. ✅ Добавлен `USE_POSTGRES=True` в `.env`
3. ✅ Настройки БД уже есть в `.env`

## 🔧 Что нужно сделать вручную:

### Шаг 1: Создать пользователя и базу данных PostgreSQL

**Вариант A: Через скрипт (требует sudo пароль)**

```bash
cd /home/batyr/projects/LanG/back
./fix_postgres.sh
```

**Вариант B: Вручную через psql**

```bash
sudo -u postgres psql
```

Затем выполни в psql:

```sql
-- Удаляем старые (если есть)
DROP DATABASE IF EXISTS lang_db;
DROP USER IF EXISTS lang_user;

-- Создаем пользователя
CREATE USER lang_user WITH PASSWORD 'lang_password';

-- Создаем базу данных
CREATE DATABASE lang_db OWNER lang_user;

-- Даем права
GRANT ALL PRIVILEGES ON DATABASE lang_db TO lang_user;
ALTER USER lang_user CREATEDB;

-- Выход
\q
```

### Шаг 2: Проверить подключение Django

```bash
cd /home/batyr/projects/LanG/back
source venv/bin/activate
python manage.py check --database default
```

Если видишь ошибку подключения - проверь пароль в `.env` и в PostgreSQL.

### Шаг 3: Выполнить миграции

```bash
python manage.py migrate
```

### Шаг 4: Перенести данные из SQLite (если есть важные данные)

**Вариант A: Через скрипт**

```bash
python migrate_sqlite_to_postgres.py
```

**Вариант B: Вручную**

```bash
# 1. Создать дамп из SQLite
USE_POSTGRES=False python manage.py dumpdata \
  --exclude=contenttypes \
  --exclude=auth.permission \
  --exclude=sessions \
  > sqlite_dump.json

# 2. Загрузить в PostgreSQL
USE_POSTGRES=True python manage.py loaddata sqlite_dump.json
```

### Шаг 5: Создать суперпользователя (если нужно)

```bash
python manage.py createsuperuser
```

### Шаг 6: Обновить chat-service

Создай `.env` файл в `chat-service`:

```bash
cd /home/batyr/projects/LanG/chat-service
cp .env.example .env
```

Затем отредактируй `.env` и укажи:

```env
# JWT Secret (должен совпадать с Django SECRET_KEY)
JWT_SECRET=your-secret-key-change-this-in-production

# PostgreSQL (та же БД что и Django)
DATABASE_URL=postgresql://lang_user:lang_password@localhost:5432/lang_db
```

### Шаг 7: Проверить chat-service

```bash
cd /home/batyr/projects/LanG/chat-service
export PATH="$HOME/.bun/bin:$PATH"
bun run dev
```

## 🔍 Проверка работы

### Django:
```bash
cd /home/batyr/projects/LanG/back
source venv/bin/activate
python manage.py dbshell
```

В psql выполни:
```sql
\dt  -- список таблиц
SELECT COUNT(*) FROM users_user;  -- проверка данных
\q
```

### Chat Service:
```bash
curl http://localhost:3001/health
```

## ❗ Важные моменты:

1. **SECRET_KEY** в Django и **JWT_SECRET** в chat-service должны совпадать!
2. **DATABASE_URL** в chat-service должен указывать на ту же БД что и Django
3. После переноса данных можно удалить `db.sqlite3` (но лучше сначала проверить что все работает)

## 🐛 Решение проблем:

### Ошибка: "password authentication failed"
- Проверь пароль в `.env` и в PostgreSQL
- Убедись что пользователь создан правильно

### Ошибка: "database does not exist"
- Запусти `fix_postgres.sh` или создай БД вручную

### Ошибка подключения chat-service
- Проверь `DATABASE_URL` в `.env` chat-service
- Убедись что PostgreSQL запущен: `systemctl status postgresql`

