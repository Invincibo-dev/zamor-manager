const webpush = require("web-push");

const { mysqlPool } = require("../config/database");
const appLogger = require("../utils/logger");

// VAPID configuré uniquement si les clés sont présentes dans l'environnement.
// Sans clés, les push sont silencieusement ignorés (pas d'erreur serveur).
let vapidReady = false;
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  let subject = process.env.VAPID_SUBJECT || "mailto:admin@zamor.app";
  if (!subject.startsWith("mailto:") && !subject.startsWith("https://")) {
    subject = "mailto:" + subject;
  }
  webpush.setVapidDetails(subject, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  vapidReady = true;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

const subscribe = async (req, res, next) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, message: "Subscription invalide." });
    }

    await mysqlPool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth), user_id = VALUES(user_id)`,
      [req.user.id, endpoint, keys.p256dh, keys.auth]
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ success: false, message: "endpoint requis." });

    await mysqlPool.query("DELETE FROM push_subscriptions WHERE endpoint = ? AND user_id = ?", [
      endpoint,
      req.user.id,
    ]);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const getVapidPublicKey = (req, res) => {
  if (!vapidReady) {
    return res.status(503).json({ success: false, message: "Push non configuré." });
  }
  res.json({ success: true, publicKey: process.env.VAPID_PUBLIC_KEY });
};

// ─── Fonction interne — appelée depuis saleController après une vente ─────────

const sendLowStockAlerts = async (alertes) => {
  if (!vapidReady || alertes.length === 0) return;

  try {
    const [subs] = await mysqlPool.query(
      `SELECT ps.endpoint, ps.p256dh, ps.auth
       FROM push_subscriptions ps
       JOIN users u ON u.id = ps.user_id
       WHERE u.role IN ('admin', 'gestionnaire')`
    );

    if (subs.length === 0) return;

    const payload = JSON.stringify({
      title: `Stock faible — ${alertes.length} produit${alertes.length > 1 ? "s" : ""}`,
      body: alertes.map((p) => `${p.nom} : ${p.quantite_stock} restant`).join("\n"),
      url: "/phones",
      tag: "low-stock",
    });

    const results = await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
          { TTL: 3600 }
        )
      )
    );

    // Nettoyer les abonnements expirés (410 Gone)
    const expired = [];
    results.forEach((r, i) => {
      if (r.status === "rejected" && r.reason?.statusCode === 410) {
        expired.push(subs[i].endpoint);
      }
    });
    if (expired.length > 0) {
      await mysqlPool
        .query("DELETE FROM push_subscriptions WHERE endpoint IN (?)", [expired])
        .catch(() => {});
    }

    appLogger.info(`[Push] ${alertes.length} alerte(s) envoyées à ${subs.length} abonné(s)`);
  } catch (err) {
    appLogger.error(`[Push] sendLowStockAlerts erreur: ${err.message}`);
  }
};

module.exports = { subscribe, unsubscribe, getVapidPublicKey, sendLowStockAlerts };
