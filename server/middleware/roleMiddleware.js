const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admins only.",
    });
  }

  next();
};

const adminOrGestionnaire = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "admin" && req.user.role !== "gestionnaire") {
    return res.status(403).json({
      success: false,
      message: "Admins and gestionnaires only.",
    });
  }

  next();
};

module.exports = {
  adminOnly,
  adminOrGestionnaire,
};
