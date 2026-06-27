const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join(".") || "body",
      message: e.message,
    }));

    return res.status(422).json({
      success: false,
      message: "Validation failed.",
      errors,
    });
  }

  // Remplace req.body par les données coercées/transformées par Zod
  req.body = result.data;
  next();
};

module.exports = { validate };
