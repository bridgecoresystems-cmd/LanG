import { describe, it, expect } from "bun:test";
import { app } from "./index";

describe("API health check", () => {
  it("возвращает status ok на /api/v1/health", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/v1/health")
    );

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toEqual({ status: "ok" });
  });
});

describe("Корневой роут API", () => {
  it('возвращает строку "Hello LanG API" на /', async () => {
    const response = await app.handle(
      new Request("http://localhost/")
    );

    expect(response.status).toBe(200);
    const text = await response.text();

    expect(text).toBe("Hello LanG API");
  });
});

describe("Профиль /api/v1/me без сессии", () => {
  it("возвращает ошибку Unauthorized без cookie", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/v1/me")
    );

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toEqual({ error: "Unauthorized", status: 401 });
  });
});

describe("Cabinet /gems без авторизации", () => {
  it("возвращает 401 и ошибку Unauthorized", async () => {
    const response = await app.handle(
      new Request("http://localhost/api/v1/cabinet/gems/wallet")
    );

    expect(response.status).toBe(401);
    const json = await response.json();

    expect(json).toEqual({ error: "Unauthorized" });
  });
});



