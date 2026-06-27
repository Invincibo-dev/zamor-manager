const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { User } = require("../models");

const parseExpiresMs = (str = "7d") => {
  const num = parseInt(str, 10);
  if (str.endsWith("d")) return num * 24 * 60 * 60 * 1000;
  if (str.endsWith("h")) return num * 60 * 60 * 1000;
  if (str.endsWith("m")) return num * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000;
};

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: parseExpiresMs(process.env.JWT_EXPIRES_IN || "7d"),
  path: "/",
};

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const ALLOWED_ROLES = ["vendeur", "gestionnaire"];

const createSeller = async (req, res, next) => {
  try {
    const { name, email, password, role = "vendeur" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email and password are required.",
      });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Le rôle doit être l'un de : ${ALLOWED_ROLES.join(", ")}.`,
      });
    }

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword, role });

    return res.status(201).json({
      success: true,
      message: "Compte créé avec succès.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const recordLoginHistory = (req, userId, email, success) => {
  const { mysqlPool } = require("../config/database");
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const ua = (req.headers["user-agent"] || "").slice(0, 500);
  mysqlPool
    .query(
      `INSERT INTO login_history (user_id, email, ip, user_agent, success)
       VALUES (?, ?, ?, ?, ?)`,
      [userId || null, email, ip, ua || null, success ? 1 : 0]
    )
    .catch(() => {});
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required.",
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      recordLoginHistory(req, null, email, false);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      recordLoginHistory(req, user.id, email, false);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    recordLoginHistory(req, user.id, email, true);
    res.cookie("token", generateToken(user), COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const logout = (_req, res) => {
  res.clearCookie("token", { path: "/" });
  return res.status(200).json({ success: true });
};

const me = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

module.exports = {
  createSeller,
  login,
  logout,
  me,
};
