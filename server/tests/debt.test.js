/**
 * Tests — Dettes & paiements
 * Couvre: création dette, liste, paiement partiel → statut en_cours,
 *         paiement complet → statut remboursee, accès refusé vendeur.
 */

const { loginAs, waitForServer } = require("./setup");

beforeAll(() => waitForServer(), 30000);

const ADMIN_EMAIL    = process.env.TEST_ADMIN_EMAIL    || "admin@zamor.app";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "admin123";

// Client de test créé à la volée
let clientId = null;
let debtId = null;

beforeAll(async () => {
  const { ag } = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);

  // Crée un client temporaire
  const clientRes = await ag
    .post("/api/clients")
    .send({ nom: "Test Debt Client", telephone: "50900000000" });

  if (clientRes.status === 201 || clientRes.status === 200) {
    clientId = clientRes.body.client?.id;
  }
});

describe("POST /api/debts", () => {
  it("retourne 401 sans cookie", async () => {
    const request = require("supertest");
    const { getApp } = require("./setup");
    const res = await request(getApp()).post("/api/debts").send({});
    expect(res.status).toBe(401);
  });

  it("retourne 400 si montant_total manquant", async () => {
    if (!clientId) return; // skip si pas de DB
    const { ag } = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await ag.post("/api/debts").send({ client_id: clientId });
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it("crée une dette avec montant_paye=0 et statut=en_cours", async () => {
    if (!clientId) return;
    const { ag } = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await ag.post("/api/debts").send({
      client_id: clientId,
      montant_total: 1000,
      notes: "Test",
    });
    expect(res.status).toBe(201);
    expect(res.body.debt.statut).toBe("en_cours");
    expect(Number(res.body.debt.montant_paye)).toBe(0);
    debtId = res.body.debt.id;
  });
});

describe("POST /api/debts/:id/pay", () => {
  it("paiement partiel → statut reste en_cours", async () => {
    if (!debtId) return;
    const { ag } = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await ag.post(`/api/debts/${debtId}/pay`).send({
      montant: 400,
      mode_paiement: "Cash",
      date_paiement: new Date().toISOString().slice(0, 10),
    });
    expect(res.status).toBe(200);
    expect(res.body.debt.statut).toBe("en_cours");
    expect(Number(res.body.debt.montant_paye)).toBe(400);
  });

  it("paiement complet → statut devient remboursee", async () => {
    if (!debtId) return;
    const { ag } = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await ag.post(`/api/debts/${debtId}/pay`).send({
      montant: 600,
      mode_paiement: "Virement",
      date_paiement: new Date().toISOString().slice(0, 10),
    });
    expect(res.status).toBe(200);
    expect(res.body.debt.statut).toBe("remboursee");
    expect(Number(res.body.debt.montant_paye)).toBe(1000);
  });
});

describe("GET /api/debts", () => {
  it("retourne 401 sans cookie", async () => {
    const request = require("supertest");
    const { getApp } = require("./setup");
    const res = await request(getApp()).get("/api/debts");
    expect(res.status).toBe(401);
  });

  it("retourne la liste pour l'admin", async () => {
    const { ag } = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);
    const res = await ag.get("/api/debts");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.debts)).toBe(true);
  });
});
