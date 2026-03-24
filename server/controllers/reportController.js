const { Op, fn, col } = require("sequelize");

const { SaleReceipt } = require("../models");

const getSummary = async (where) => {
  const summary = await SaleReceipt.findOne({
    where,
    attributes: [
      [fn("COUNT", col("id")), "nombre_ventes"],
      [fn("COALESCE", fn("SUM", col("total_general")), 0), "chiffre_affaires_total"],
    ],
    raw: true,
  });

  return {
    nombre_ventes: Number(summary?.nombre_ventes || 0),
    chiffre_affaires_total: Number(summary?.chiffre_affaires_total || 0),
  };
};

const buildDateRange = (startDate, endDate) => ({
  [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59`],
});

const getDailyReport = async (_req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const report = await getSummary({ date: buildDateRange(today, today) });

    res.status(200).json({ success: true, ...report });
  } catch (error) {
    next(error);
  }
};

const getWeeklyReport = async (_req, res, next) => {
  try {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const start = new Date(now);
    start.setDate(now.getDate() + diffToMonday);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const report = await getSummary({
      date: buildDateRange(
        start.toISOString().slice(0, 10),
        end.toISOString().slice(0, 10)
      ),
    });

    res.status(200).json({ success: true, ...report });
  } catch (error) {
    next(error);
  }
};

const getMonthlyReport = async (_req, res, next) => {
  try {
    const now = new Date();
    const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10);
    const report = await getSummary({ date: buildDateRange(start, end) });

    res.status(200).json({ success: true, ...report });
  } catch (error) {
    next(error);
  }
};

const getYearlyReport = async (_req, res, next) => {
  try {
    const year = new Date().getFullYear();
    const report = await getSummary({
      date: buildDateRange(`${year}-01-01`, `${year}-12-31`),
    });

    res.status(200).json({ success: true, ...report });
  } catch (error) {
    next(error);
  }
};

const getCustomReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required.",
      });
    }

    const report = await getSummary({
      date: buildDateRange(startDate, endDate),
    });

    res.status(200).json({ success: true, ...report, startDate, endDate });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getYearlyReport,
  getCustomReport,
};
