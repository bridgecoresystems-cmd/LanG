# Nuxt 3 Best Practices

Best practices for Nuxt 3 development, focusing on project structure, components, and server-side features.

This document outlines recommended best practices for developing applications with Nuxt 3.

## 1. Project Structure

- **Clear separation**: Organize files logically within Nuxt's conventions (`pages/`, `components/`, `layouts/`, `composables/`, `server/`, `plugins/`, `middleware/`, `stores/`).
- **Feature-based organization (optional)**: For larger projects, consider grouping related pages, components, and composables within a feature directory if it improves maintainability, especially for `pages` routes.

## 2. Components

- **Atomic Design**: Structure components from smallest (atoms) to largest (pages) for reusability and maintainability.
- **Props & Emits**: Use explicit `props` for data input and `emits` for events to maintain clear component interfaces.
- **Slots**: Leverage slots for flexible content distribution within components.
- **Lazy Loading**: Use `defineAsyncComponent` or Nuxt's automatic lazy loading for components that are not critical for initial page load (`<ClientOnly>`, dynamic imports).

## 3. Composables (Vue 3 Composition API)

- **Reusable Logic**: Extract reusable, stateful logic into composables (e.g., `useAuth`, `useCart`).
- **Naming Convention**: Prefix composables with `use` (e.g., `useCounter.ts`).
- **Reactive State**: Manage reactive state appropriately using `ref`, `reactive`, `computed`, `watch`.

## 4. State Management (Pinia)

- **Pinia**: Use Pinia for centralized state management.
- **Modular Stores**: Organize stores into modules based on features or domains.
- **Actions for Logic**: Keep complex business logic within store actions.

## 5. Server-Side Features (`server/` directory)

- **API Routes**: Define API endpoints in `server/api/` for type-safe and performant backend logic.
- **Server Middleware**: Use `server/middleware/` for tasks like authentication, logging, or proxying requests.
- **Server Utilities**: Place reusable server-side logic in `server/utils/`.

## 6. Plugins

- **Global Functionality**: Use `plugins/` for injecting global utilities, libraries, or configurations into the Vue app instance.
- **Auto-imports**: Leverage Nuxt's auto-import feature for plugins and composables to reduce boilerplate.

## 7. Routing

- **File-System Routing**: Utilize Nuxt's file-system based routing (`pages/` directory).
- **Middleware**: Implement route-specific logic, authentication checks, or redirection using `middleware/`.

## 8. TypeScript

- **Strict Typing**: Maximize TypeScript usage for type safety across the entire application, especially for props, emits, store state, and API responses.
- **Interfaces & Types**: Define interfaces and types for complex data structures.
