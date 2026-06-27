const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 10;

const loginRateLimit = async (req, res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";

  try {
    const { mysqlPool } = require("../config/database");

    // Lire l'état actuel (fenêtre encore active)
    const [[record]] = await mysqlPool.query(
      "SELECT count FROM login_attempts WHERE ip = ? AND reset_at > NOW()",
      [ip]
    );

    if (record && record.count >= MAX_ATTEMPTS) {
      return res.status(429).json({
        success: false,
        message: "Too many login attempts. Please try again later.",
      });
    }

    // Incrémenter ou créer l'entrée
    await mysqlPool.query(
      `INSERT INTO login_attempts (ip, count, reset_at)
       VALUES (?, 1, DATE_ADD(NOW(), INTERVAL ? MINUTE))
       ON DUPLICATE KEY UPDATE
         count   = IF(reset_at <= NOW(), 1, count + 1),
         reset_at = IF(reset_at <= NOW(),
                      DATE_ADD(NOW(), INTERVAL ? MINUTE),
                      reset_at)`,
      [ip, WINDOW_MINUTES, WINDOW_MINUTES]
    );

    next();
  } catch (dbError) {
    // Ne pas bloquer l'accès si la DB est indisponible
    console.error("[rate-limit] DB error:", dbError.message);
    next();
  }
};

module.exports = {
  loginRateLimit,
};
