const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attemptsByIp = new Map();

const loginRateLimit = (req, res, next) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const now = Date.now();
  const record = attemptsByIp.get(ip);

  if (!record || now > record.resetAt) {
    attemptsByIp.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return next();
  }

  if (record.count >= MAX_ATTEMPTS) {
    return res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again later.",
    });
  }

  record.count += 1;
  attemptsByIp.set(ip, record);
  next();
};

module.exports = {
  loginRateLimit,
};
