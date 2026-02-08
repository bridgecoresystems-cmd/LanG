# Frontend (Nuxt 3)

**Требование:** Node.js 22.12+ (Vite 7 в Nuxt 3.21 не поддерживает Node 18)

## Установка

```bash
bun install
```

## Разработка

```bash
bun run dev
```

Скрипт `dev` явно запускает Nuxt через Node.js (не Bun), т.к. Vite 7 использует `crypto.hash()`, доступный только в Node 21.7+.

## Обновить Node.js

Если ошибка `crypto.hash is not a function` — обновите Node до 22+:

```bash
# nvm
nvm install 22 && nvm use 22

# fnm
fnm install 22 && fnm use 22

# Или скачайте LTS с https://nodejs.org/
```
