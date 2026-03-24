const logger = (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  const startedAt = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - startedAt;
    console.log(
      `[prod] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });

  next();
};

module.exports = {
  logger,
};
