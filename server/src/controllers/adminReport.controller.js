const { saleReceiptModel } = require("../models");

const toRangeResponse = async (res, label, startDate, endDate) => {
  const summary = await saleReceiptModel.getSalesSummaryBetweenDates({
    startDate,
    endDate,
  });

  return res.status(200).json({
    success: true,
    periode: label,
    startDate,
    endDate,
    nombre_ventes: Number(summary.nombre_ventes || 0),
    chiffre_affaires_total: Number(summary.chiffre_affaires_total || 0),
  });
};

const getTodayReport = async (_req, res, next) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const date = `${year}-${month}-${day}`;

    return await toRangeResponse(
      res,
      "today",
      `${date} 00:00:00`,
      `${date} 23:59:59`
    );
  } catch (error) {
    next(error);
  }
};

const getWeekReport = async (_req, res, next) => {
  try {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const start = new Date(now);
    start.setDate(now.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return await toRangeResponse(
      res,
      "week",
      formatDateTime(start),
      formatDateTime(end)
    );
  } catch (error) {
    next(error);
  }
};

const getMonthReport = async (_req, res, next) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return await toRangeResponse(
      res,
      "month",
      formatDateTime(start),
      formatDateTime(end)
    );
  } catch (error) {
    next(error);
  }
};

const getYearReport = async (_req, res, next) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

    return await toRangeResponse(
      res,
      "year",
      formatDateTime(start),
      formatDateTime(end)
    );
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

    return await toRangeResponse(
      res,
      "custom",
      normalizeStartDate(startDate),
      normalizeEndDate(endDate)
    );
  } catch (error) {
    next(error);
  }
};

const pad = (value) => String(value).padStart(2, "0");

const formatDateTime = (date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const normalizeStartDate = (value) => {
  return value.length === 10 ? `${value} 00:00:00` : value;
};

const normalizeEndDate = (value) => {
  return value.length === 10 ? `${value} 23:59:59` : value;
};

module.exports = {
  getTodayReport,
  getWeekReport,
  getMonthReport,
  getYearReport,
  getCustomReport,
};
