# 📍 Где хранится PostgreSQL в проекте?

## Важно понять:

**PostgreSQL НЕ хранится в папке проекта!** 

PostgreSQL - это **системный сервис**, который работает независимо от твоего проекта. Данные хранятся в **системной директории** операционной системы.

## 🔍 Где физически хранятся данные PostgreSQL?

### Стандартные места (зависит от ОС и способа установки):

#### Ubuntu/Debian (твоя система):
```
/var/lib/postgresql/[VERSION]/main/
```

Например:
```
/var/lib/postgresql/14/main/
```

#### Структура директории:
```
/var/lib/postgresql/14/main/
├── base/              # Основные данные БД
│   ├── 1/            # Системные каталоги
│   ├── 16384/        # Твоя база lang_db (OID базы)
│   │   ├── 16385     # Таблица users_user
│   │   ├── 16386     # Таблица chat_room
│   │   └── ...
│   └── ...
├── global/            # Глобальные данные
├── pg_wal/            # Write-Ahead Log (WAL)
├── pg_tblspc/         # Табличные пространства
└── ...
```

### Как найти точное местоположение:

#### Способ 1: Через PostgreSQL
```bash
sudo -u postgres psql -c "SHOW data_directory;"
```

#### Способ 2: Через конфигурацию
```bash
cat /etc/postgresql/*/main/postgresql.conf | grep data_directory
```

#### Способ 3: Через процесс
```bash
ps aux | grep postgres | grep -oP 'data_directory=\K[^\s]+'
```

## 🗂️ Что хранится в папке проекта?

В папке проекта (`/home/batyr/projects/LanG/back/`) хранится только:

1. **Настройки подключения** (`.env`):
   ```env
   DB_NAME=lang_db
   DB_USER=lang_user
   DB_PASSWORD=lang_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

2. **Миграции Django** (`apps/*/migrations/`):
   - Файлы миграций, которые создают структуру БД

3. **Модели Django** (`apps/*/models.py`):
   - Описание структуры данных

## 🔗 Как проект подключается к PostgreSQL?

```
┌─────────────────┐
│  Django проект  │
│  (back/)        │
│                 │
│  .env файл      │──┐
│  settings.py    │  │
└─────────────────┘  │
                     │
                     ▼
              ┌──────────────┐
              │  PostgreSQL   │
              │  (системный   │
              │   сервис)     │
              │               │
              │  /var/lib/    │
              │  postgresql/  │
              └──────────────┘
```

## 📊 Твоя база данных `lang_db`:

Физически находится в:
```
/var/lib/postgresql/14/main/base/[OID_базы]/
```

Где `OID_базы` - это уникальный идентификатор базы данных в PostgreSQL.

## 🔐 Права доступа:

- Данные PostgreSQL принадлежат пользователю `postgres`
- Обычные пользователи не имеют прямого доступа к файлам
- Доступ только через PostgreSQL клиент (`psql`) или Django

## 💡 Почему так?

1. **Безопасность**: Данные защищены системными правами
2. **Производительность**: Оптимизированное расположение на диске
3. **Управление**: Централизованное управление всеми БД
4. **Резервное копирование**: Легче делать бэкапы всей системы

## 🛠️ Полезные команды:

### Посмотреть размер базы данных:
```bash
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('lang_db'));"
```

### Посмотреть список баз данных:
```bash
sudo -u postgres psql -l
```

### Подключиться к базе:
```bash
psql -U lang_user -d lang_db -h localhost
```

### Через Django:
```bash
cd /home/batyr/projects/LanG/back
source venv/bin/activate
python manage.py dbshell
```

## 📝 Итог:

- **Данные PostgreSQL**: `/var/lib/postgresql/14/main/` (системная директория)
- **Настройки проекта**: `/home/batyr/projects/LanG/back/.env` (в проекте)
- **Подключение**: Django → PostgreSQL через настройки в `.env`

Данные **НЕ в проекте**, но проект **знает как к ним подключиться** через настройки!

