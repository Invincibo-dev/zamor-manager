const bcrypt = require("bcryptjs");

const { userModel } = require("../models");
const generateToken = require("../utils/generateToken");

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const register = async (req, res, next) => {
  try {
    const { name, email, password, role = "vendeur" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email and password are required.",
      });
    }

    if (!["admin", "vendeur"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "role must be admin or vendeur.",
      });
    }

    const existingUser = await userModel.findByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
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

    const user = await userModel.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const token = generateToken({
      id: user.id,
      role: user.role,
      email: user.email,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
};
