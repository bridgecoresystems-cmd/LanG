# Bun Runtime Best Practices

Best practices for using Bun as the JavaScript runtime, covering package management, execution, and native APIs.

This document outlines recommended best practices for utilizing Bun as your primary JavaScript runtime.

## 1. Package Management (`bun install`, `bun add`, `bun remove`)

- **Prefer Bun's Package Manager**: Use `bun install`, `bun add`, `bun remove` for managing dependencies. Bun is significantly faster than npm, yarn, or pnpm.
- **`bun.lockb`**: Commit `bun.lockb` to version control to ensure consistent installations across environments.
- **Migrating Lockfiles**: Bun can automatically migrate existing `package-lock.json`, `yarn.lock`, or `pnpm-lock.yaml` files to `bun.lockb`.

## 2. Script Execution (`bun run`)

- **`bun run` for scripts**: Use `bun run <script-name>` to execute scripts defined in `package.json`. This leverages Bun's speed for script execution.
- **Direct File Execution**: Execute JavaScript/TypeScript files directly with `bun <file.ts/js>` for fast script execution without `node`.

## 3. Native APIs

- **Built-in Web APIs**: Leverage Bun's built-in support for Web APIs like `fetch`, `WebSocket`, `Request`, `Response`, `URL` for consistency with browser environments and performance.
- **Bun-Specific APIs**: Utilize Bun's native APIs for specific tasks like `Bun.file()`, `Bun.serve()`, `Bun.password.verify()` for optimized performance and functionality.
- **FFI for Native Libraries**: When interacting with native system libraries, consider Bun's FFI (Foreign Function Interface) for direct calls, if performance is critical and a JavaScript binding is not available.

## 4. TypeScript Support

- **First-Class TypeScript**: Bun has native, fast TypeScript support. You can execute `.ts` and `.tsx` files directly without prior compilation.
- **`tsconfig.json`**: Configure `tsconfig.json` for project-specific TypeScript settings, type checking, and IDE integration.

## 5. Environment Variables

- **`.env` files**: Bun automatically loads environment variables from `.env` files. Access them via `process.env`.

## 6. Development Server

- **Bun.serve()**: For simple HTTP servers, use `Bun.serve()` for its high performance and ease of use.
- **Hot Reloading**: For frameworks that support it, Bun often provides excellent hot-reloading performance.

## 7. Testing (`bun test`)

- **Built-in Test Runner**: Use `bun test` for running tests. Bun includes a fast, Jest-compatible test runner.

## 8. Build Tooling (`bun build`)

- **Built-in Bundler**: Use `bun build` for bundling JavaScript, TypeScript, and web assets. It's an extremely fast bundler with esbuild-like performance.

## 9. Performance Considerations

- **Zero-Cost Abstractions**: Benefit from Bun's focus on low-overhead and high-performance primitives.
- **Native Code**: Understand that many of Bun's optimizations come from its native implementation in Zig.
