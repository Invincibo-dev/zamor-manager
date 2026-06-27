const winstonLogger = require("../utils/logger");

const logger = (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  const startedAt = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "http";

    winstonLogger[level](`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
};

module.exports = {
  logger,
};
