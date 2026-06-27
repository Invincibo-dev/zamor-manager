const jwt = require("jsonwebtoken");

const { User } = require("../models");

const protect = async (req, res, next) => {
  try {
    // Cookie HttpOnly en priorité, fallback sur Authorization Bearer (rétrocompat)
    let token = req.cookies?.token;

    if (!token) {
      const authorization = req.headers.authorization || "";
      if (authorization.startsWith("Bearer ")) {
        token = authorization.split(" ")[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token required.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ["id", "name", "email", "role", "created_at", "updated_at"],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    req.user = user;
    next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = {
  protect,
};
