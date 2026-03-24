const jwt = require("jsonwebtoken");

const { User } = require("../models");

const protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || "";
    const queryToken = req.query.token;

    if (!authorization.startsWith("Bearer ") && !queryToken) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Token required.",
      });
    }

    const token = authorization.startsWith("Bearer ")
      ? authorization.split(" ")[1]
      : queryToken;
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
