/**
 * Helpers partagés entre les tests.
 * Le serveur démarre une fois (migrations + listen) via app.ready,
 * puis supertest crée ses propres connexions HTTP.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "silent";

const request = require("supertest");

// Require server.js — déclenche startServer() (migrations + app.listen)
const app = require("../server");

// Chaque fichier de test doit appeler beforeAll(waitForServer) pour s'assurer
// que les migrations sont terminées avant la première requête.
const waitForServer = () => app.ready;

const agent = () => request.agent(app);

const loginAs = async (email, password) => {
  const ag = agent();
  const res = await ag.post("/api/auth/login").send({ email, password });
  return { ag, res };
};

const getApp = () => app;

module.exports = { getApp, agent, loginAs, waitForServer };
