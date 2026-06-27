/**
 * Tests — Authentification
 * Couvre: login OK, mauvais mot de passe, email inexistant, champ manquant,
 *         cookie JWT posé, profil retourné, logout.
 */

const request = require("supertest");
const { getApp, loginAs, waitForServer } = require("./setup");

beforeAll(() => waitForServer(), 30000);

describe("POST /api/auth/login", () => {
  const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@zamor.app";
  const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "admin123";

  it("retourne 400 si email manquant", async () => {
    const res = await request(getApp())
      .post("/api/auth/login")
      .send({ password: "pass" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("retourne 400 si password manquant", async () => {
    const res = await request(getApp())
      .post("/api/auth/login")
      .send({ email: ADMIN_EMAIL });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("retourne 401 pour un email inexistant", async () => {
    const res = await request(getApp())
      .post("/api/auth/login")
      .send({ email: "nobody@nowhere.com", password: "whatever" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("retourne 401 pour un mauvais mot de passe", async () => {
    const res = await request(getApp())
      .post("/api/auth/login")
      .send({ email: ADMIN_EMAIL, password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("retourne 200 + cookie JWT pour des identifiants valides", async () => {
    const { res } = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(ADMIN_EMAIL);
    // Cookie HttpOnly posé
    const setCookie = res.headers["set-cookie"] || [];
    expect(setCookie.some((c) => c.startsWith("token="))).toBe(true);
  });
});

describe("GET /api/auth/me", () => {
  const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@zamor.app";
  const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "admin123";

  it("retourne 401 sans cookie", async () => {
    const res = await request(getApp()).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("retourne le profil si authentifié", async () => {
    const { ag } = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await ag.get("/api/auth/me");
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(ADMIN_EMAIL);
  });
});

describe("POST /api/auth/logout", () => {
  const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@zamor.app";
  const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "admin123";

  it("efface le cookie et renvoie 200", async () => {
    const { ag } = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await ag.post("/api/auth/logout");
    expect(res.status).toBe(200);
    // Vérifie que le cookie est expiré
    const setCookie = res.headers["set-cookie"] || [];
    expect(setCookie.some((c) => c.includes("token=;") || c.includes("Max-Age=0"))).toBe(true);
  });
});
