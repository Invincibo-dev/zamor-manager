const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS_IP = 10;
const MAX_ATTEMPTS_EMAIL = 5;

const loginRateLimit = async (req, res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const email = typeof req.body?.email === "string"
    ? req.body.email.trim().toLowerCase()
    : null;

  try {
    const { mysqlPool } = require("../config/database");

    // Vérification par IP
    const [[ipRecord]] = await mysqlPool.query(
      "SELECT count FROM login_attempts WHERE ip = ? AND reset_at > NOW()",
      [ip]
    );
    if (ipRecord && ipRecord.count >= MAX_ATTEMPTS_IP) {
      return res.status(429).json({
        success: false,
        message: "Trop de tentatives depuis votre adresse IP. Réessayez dans 15 minutes.",
      });
    }

    // Vérification par email (protège un compte cible même depuis IPs différentes)
    if (email) {
      const [[emailRecord]] = await mysqlPool.query(
        "SELECT count FROM login_attempts_email WHERE email = ? AND reset_at > NOW()",
        [email]
      );
      if (emailRecord && emailRecord.count >= MAX_ATTEMPTS_EMAIL) {
        return res.status(429).json({
          success: false,
          message: "Trop de tentatives sur ce compte. Réessayez dans 15 minutes.",
        });
      }
    }

    // Incrémenter compteur IP
    await mysqlPool.query(
      `INSERT INTO login_attempts (ip, count, reset_at)
       VALUES (?, 1, DATE_ADD(NOW(), INTERVAL ? MINUTE))
       ON DUPLICATE KEY UPDATE
         count    = IF(reset_at <= NOW(), 1, count + 1),
         reset_at = IF(reset_at <= NOW(), DATE_ADD(NOW(), INTERVAL ? MINUTE), reset_at)`,
      [ip, WINDOW_MINUTES, WINDOW_MINUTES]
    );

    // Incrémenter compteur email
    if (email) {
      await mysqlPool.query(
        `INSERT INTO login_attempts_email (email, count, reset_at)
         VALUES (?, 1, DATE_ADD(NOW(), INTERVAL ? MINUTE))
         ON DUPLICATE KEY UPDATE
           count    = IF(reset_at <= NOW(), 1, count + 1),
           reset_at = IF(reset_at <= NOW(), DATE_ADD(NOW(), INTERVAL ? MINUTE), reset_at)`,
        [email, WINDOW_MINUTES, WINDOW_MINUTES]
      );
    }

    next();
  } catch (dbError) {
    console.error("[rate-limit] DB error:", dbError.message);
    next(); // Ne pas bloquer si la DB est indisponible
  }
};

module.exports = { loginRateLimit };
