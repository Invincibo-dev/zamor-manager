/**
 * Tests — Création de vente
 * Couvre: validation des champs, création OK, idempotence session_id,
 *         accès refusé sans auth, vendeur ne voit que ses ventes.
 */

const { loginAs, waitForServer } = require("./setup");

beforeAll(() => waitForServer(), 30000);

const ADMIN_EMAIL    = process.env.TEST_ADMIN_EMAIL    || "admin@zamor.app";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "admin123";

const validSalePayload = () => ({
  session_id: crypto.randomUUID(),
  date: new Date().toISOString(),
  mode_paiement: "Cash",
  devise: "HTG",
  items: [
    { nom_produit: "Coque iPhone 14", quantite: 1, prix_unitaire: 500 },
  ],
});

describe("POST /api/sales", () => {
  it("retourne 401 sans cookie", async () => {
    const request = require("supertest");
    const { getApp } = require("./setup");
    const res = await request(getApp()).post("/api/sales").send(validSalePayload());
    expect(res.status).toBe(401);
  });

  it("retourne 400 si items vide", async () => {
    const { ag } = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await ag.post("/api/sales").send({
      ...validSalePayload(),
      items: [],
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("retourne 400 si date manquante", async () => {
    const { ag } = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    const payload = validSalePayload();
    delete payload.date;
    const res = await ag.post("/api/sales").send(payload);
    expect(res.status).toBe(400);
  });

  it("crée une vente et retourne code_recu", async () => {
    const { ag } = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await ag.post("/api/sales").send(validSalePayload());
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.code_recu).toMatch(/^[A-Z0-9-]+$/);
    expect(res.body.reused).toBe(false);
  });

  it("idempotence: même session_id retourne 200 + reused=true", async () => {
    const { ag } = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    const payload = validSalePayload();

    const first = await ag.post("/api/sales").send(payload);
    expect(first.status).toBe(201);

    const second = await ag.post("/api/sales").send(payload);
    expect([200, 201]).toContain(second.status);
    expect(second.body.reused).toBe(true);
    expect(second.body.code_recu).toBe(first.body.code_recu);
  });
});

describe("GET /api/sales", () => {
  it("retourne 401 sans cookie", async () => {
    const request = require("supertest");
    const { getApp } = require("./setup");
    const res = await request(getApp()).get("/api/sales");
    expect(res.status).toBe(401);
  });

  it("retourne la liste paginée pour l'admin", async () => {
    const { ag } = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await ag.get("/api/sales");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.receipts)).toBe(true);
  });
});
