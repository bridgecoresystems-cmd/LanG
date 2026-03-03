# 🎓 Sprachschul-Management-System

**Eine Enterprise-Plattform für Sprachschulverwaltung**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.3-white?logo=bun)](https://bun.com/)
[![Elysia](https://img.shields.io/badge/Elysia-1.3-red?logo=elysia)](https://elysiajs.com/)
[![Nuxt](https://img.shields.io/badge/Nuxt-3.0-green?logo=nuxt.js)](https://nuxt.com/)
[![Drizzle](https://img.shields.io/badge/Drizzle-ORM-orange?logo=drizzle)](https://orm.drizzle.team/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-Auth-black)](https://better-auth.com/)

---

## 📖 Projektübersicht

**Language School** ist ein vollwertiges Verwaltungssystem für Sprachschulen mit Unterstützung für:

- 👥 **Benutzerverwaltung** (Schüler, Lehrer, Administratoren, Direktoren)
- 🏫 **Mehrere Standorte** (ein System für mehrere Schulen/Filialen)
- 📚 **Kurs- und Kategorienverwaltung** (mehrsprachig: TM/RU/EN)
- 📊 **Schülerbereich** (Leistungen, Anwesenheit, Guthaben)
- 👨‍🏫 **Lehrerbereich** (Stundenplanung, Schülerlisten, Notengebung)
- 💼 **Buchhalterbereich** (Zahlungsverarbeitung, Finanzberichte)
- 🔐 **Rollenbasierte Zugriffskontrolle** (8 Rollen)
- 💳 **Verkauf & Zahlungen** (Zahlungsverfolgung, Rabatte)
- 📱 **WebSocket Echtzeit** (Live-Benachrichtigungen)
- 🎮 **Gamification** (Edelsteine, Erfolge, Lernspiele)
- 📞 **CRM-Modul** (Anrufverwaltung für Verkaufsmanager)
- 📡 **RFID-Integration** (Anwesenheitsverfolgung via RFID-Armbänder)
- 💬 **Chat** (Echtzeit-Nachrichten zwischen Lehrern und Schülern)

---

## 🚀 Tech Stack

### Backend

| Technologie | Version | Zweck |
|-------------|---------|-------|
| **Bun** | 1.3+ | JavaScript Runtime (schnell, natives TypeScript) |
| **Elysia.js** | 1.3+ | HTTP Framework (schnell, typsicher) |
| **Drizzle ORM** | 0.45+ | TypeScript ORM für PostgreSQL |
| **Better Auth** | 1.5+ | Authentifizierung & Session-Management |
| **PostgreSQL** | 14+ | Hauptdatenbank |
| **Eden Treaty** | 1.4+ | Typsicherer API-Client |

### Frontend

| Technologie | Version | Zweck |
|-------------|---------|-------|
| **Nuxt 3** | 3.x | Vue.js Framework (SSR/SSG) |
| **Vue 3** | 3.x | UI Framework (Composition API) |
| **TypeScript** | 5.x | Statische Typprüfung |
| **Pinia** | 2.2+ | State Management |
| **Naive UI** | 2.38+ | UI-Komponenten (Schüler/Lehrer) |
| **Quasar** | 2.18+ | UI-Framework (Admin-Panel) |
| **TailwindCSS** | 3.4+ | Utility-First CSS |
| **Vue I18n** | 9.x | Internationalisierung |

---

## 🏗 Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         Language School Monorepo                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐      ┌─────────────────────┐          │
│  │   packages/frontend │      │   packages/backend  │          │
│  │                     │      │                     │          │
│  │  Nuxt 3 Application │◄────►│  Elysia.js API      │          │
│  │  ├─ Admin (Quasar)  │      │  ├─ REST API        │          │
│  │  ├─ Student Cabinet │      │  ├─ WebSocket       │          │
│  │  ├─ Teacher Cabinet │      │  ├─ Better Auth     │          │
│  │  └─ Accountant      │      │  └─ Drizzle ORM     │          │
│  └─────────────────────┘      └─────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   PostgreSQL DB  │
                    └──────────────────┘
```

---

## 📦 Installation

### Voraussetzungen

- **Bun** ≥ 1.3 (`curl -fsSL https://bun.sh/install | bash`)
- **Node.js** ≥ 22.12 (für Frontend Dev Server)
- **PostgreSQL** ≥ 14

### 1. Repository klonen

```bash
git clone <repository-url>
cd language-school
```

### 2. Abhängigkeiten installieren

```bash
bun install
```

### 3. Umgebung konfigurieren

`.env` Datei im Projektroot erstellen:

```bash
# Datenbank
DATABASE_URL=postgresql://user:password@localhost:5432/language_school

# Backend
PORT=8010
NODE_ENV=development
BETTER_AUTH_SECRET=dein-secret-key-hier
API_URL=http://localhost:8010

# Frontend
NUXT_PUBLIC_API_BASE=http://localhost:8010
```

### 4. Datenbank einrichten

```bash
# Migrationen generieren
bun run db:generate

# Migrationen anwenden
bun run db:migrate
```

---

## 🎯 Starten

### Beide gleichzeitig (empfohlen)

```bash
bun run dev
```

### Getrennt

**Terminal 1 - Backend:**
```bash
cd packages/backend
bun run dev
# → http://localhost:8010
```

**Terminal 2 - Frontend:**
```bash
cd packages/frontend
bun run dev
# → http://localhost:3000
```

---

## 🔐 Rollenbasierte Zugriffskontrolle

| Rolle | Beschreibung | Zugriff |
|-------|--------------|---------|
| **SUPERUSER** | Systemadministrator | Vollzugriff |
| **DIRECTOR** | Schuldirektor | Eigene Schule verwalten |
| **HEAD_TEACHER** | Akademischer Leiter | Lehrer + Schüler |
| **TEACHER** | Lehrer | Eigene Gruppen + Noten |
| **STUDENT** | Schüler | Eigener Bereich |
| **PARENT** | Elternteil | Kind überwachen |
| **ACCOUNTANT** | Buchhalter | Zahlungen + Berichte |

---

## 🌐 Internationalisierung

Unterstützung für drei Sprachen:

- 🇹🇲 **TM** - Turkmenisch
- 🇷🇺 **RU** - Russisch
- 🇬🇧 **EN** - Englisch

Alle Entitäten speichern Übersetzungen:
```typescript
{
  name_tm: "Diller mekdebi",
  name_ru: "Языковая школа",
  name_en: "Language school"
}
```

---

## 📸 Screenshots

> *Hier Screenshots einfügen*

### Admin Panel
![Admin Panel](./docs/screenshots/admin.png)

### Schülerbereich
![Student Cabinet](./docs/screenshots/student.png)

### Lehrerbereich
![Teacher Cabinet](./docs/screenshots/teacher.png)

### Chat
![Chat](./docs/screenshots/chat.png)

---

## 🎥 Video Demo

> *Link zum Video einfügen*

[5-Minuten Demo ansehen](#)

---

## 📊 Projektstatistiken

| Metrik | Wert |
|--------|------|
| Codezeilen | 14.000+ |
| Entwicklungszeit | 2 Monate |
| Git Commits | 30+ |
| API Endpunkte | 50+ |
| Datenbanktabellen | 20+ |
| Benutzerrollen | 8 |
| UI Seiten | 40+ |

---

## 🧩 Herausforderungen & Lösungen

### Problem: CORS im Production
**Lösung:** Trusted Origins in Better Auth konfiguriert

### Problem: WebSocket Reconnect
**Lösung:** Exponential Backoff im Client implementiert

### Problem: Session Management
**Lösung:** Von Lucia zu Better Auth migriert (4 Stunden, aber lohnt sich)

---

## 🎓 Lessons Learned

Was ich bei diesem Projekt gelernt habe:

- **Bun statt Node.js** → 60% schnellere Startup-Zeit
- **Eden Treaty** → 10+ Stunden weniger Debugging durch Typsicherheit
- **Better Auth Migration** → OAuth Support ohne eigene Implementierung
- **WebSocket Chat** → Reconnect Logic war komplexer als erwartet
- **Monorepo** → Einfacher Code-Sharing, aber komplexeres Setup
- **Drizzle ORM** → Leichter und schneller als Prisma für Bun

---

## 📚 Dokumentation

- [📖 README.md](./README.md) - Englische Version
- [🏗 ARCHITECTURE.md](./ARCHITECTURE.md) - Technische Details
- [📝 CHANGELOG.md](./CHANGELOG.md) - Versionshistorie
- [📐 docs/DECISIONS.md](./docs/DECISIONS.md) - Architekturentscheidungen
- [👨‍💻 docs/PORTFOLIO_GUIDE.md](./docs/PORTFOLIO_GUIDE.md) - Für Arbeitgeber

---

## 👨‍💻 Entwickler

**BridgeCore SYSTEMS**  
**CEO & Founder:** Batyr Akmuradov  
**Erfahrung:** 10+ Jahre in ERP-Systementwicklung  
**Standort:** Turkmenistan 🇹🇲 (offen für Umzug nach Deutschland)

| Metrik | Wert |
|--------|------|
| Abgeschlossene Projekte | 10+ |
| Zufriedene Kunden | 5+ |
| Erfolgsquote | 99% |
| Spezialisierung | ERP-Systeme |

### Kontakt

- 🌐 **Website:** [bridgecore.tech](https://bridgecore.tech)
- 📧 **E-Mail:** info@bridgecore.tech
- 💼 **Verfügbar für:** Vollzeit, Remote, Umzug

---

## 📄 Lizenz

© 2026 BridgeCore SYSTEMS. Alle Rechte vorbehalten.

---

## 🚀 Roadmap

- [ ] Mobile App (React Native / Flutter)
- [ ] Telegram Bot für Benachrichtigungen
- [ ] Zahlungsgateway-Integration
- [ ] Excel/PDF Report Exporte
- [ ] E-Mail Kampagnen
- [ ] Eltern-Lehrer Messaging

---

<div align="center">

**Entwickelt mit ❤️ using Bun + Elysia + Nuxt**

[🐛 Bug melden](../../issues) · [✨ Feature vorschlagen](../../issues)

</div>
