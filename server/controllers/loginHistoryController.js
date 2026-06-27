const { Op } = require("sequelize");

const { LoginHistory, User } = require("../models");

const MAX_LIMIT = 100;

const listHistory = async (req, res, next) => {
  try {
    const { from, to, success, user_id } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const where = {};

    if (from || to) {
      where.created_at = {};
      if (from) where.created_at[Op.gte] = `${from} 00:00:00`;
      if (to) where.created_at[Op.lte] = `${to} 23:59:59`;
    }

    if (success !== undefined && success !== "") {
      where.success = success === "true" || success === "1";
    }

    if (user_id) where.user_id = Number(user_id);

    const { count, rows } = await LoginHistory.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "role"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      history: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listHistory };
