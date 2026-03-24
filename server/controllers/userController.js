const { User } = require("../models");

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

module.exports = {
  listUsers,
};
