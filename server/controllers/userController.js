const bcrypt = require("bcryptjs");

const { User } = require("../models");

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const listUsers = async (_req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "created_at", "updated_at"],
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"],
      ],
    });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

const createSeller = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "name, email and password are required.",
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
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "vendeur",
    });

    return res.status(201).json({
      success: true,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

const resetSellerPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "newPassword is required.",
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Seller not found.",
      });
    }

    if (user.role !== "vendeur") {
      return res.status(403).json({
        success: false,
        message: "Only vendeur passwords can be reset from this endpoint.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Seller password reset successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  createSeller,
  resetSellerPassword,
};
