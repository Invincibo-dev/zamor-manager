const { Op, fn, col } = require("sequelize");

const { SaleReceipt, User, ReceiptItem } = require("../models");

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

const exportReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required.",
      });
    }

    const receipts = await SaleReceipt.findAll({
      where: { date: buildDateRange(startDate, endDate) },
      include: [
        { model: User, as: "vendeur", attributes: ["id", "name"] },
        {
          model: ReceiptItem,
          as: "items",
          attributes: ["nom_produit", "quantite", "prix_unitaire", "total"],
        },
      ],
      order: [["date", "DESC"], ["id", "DESC"]],
    });

    const rows = [];

    for (const receipt of receipts) {
      for (const item of receipt.items) {
        rows.push({
          code_recu: receipt.code_recu,
          date: new Date(receipt.date).toISOString().slice(0, 19).replace("T", " "),
          vendeur: receipt.vendeur?.name || "",
          mode_paiement: receipt.mode_paiement,
          total_recu: receipt.total_general,
          produit: item.nom_produit,
          quantite: item.quantite,
          prix_unitaire: item.prix_unitaire,
          total_ligne: item.total,
        });
      }
    }

    const headers = [
      "code_recu",
      "date",
      "vendeur",
      "mode_paiement",
      "total_recu",
      "produit",
      "quantite",
      "prix_unitaire",
      "total_ligne",
    ];

    const escapeCell = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;

    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(",")),
    ].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ventes_${startDate}_${endDate}.csv"`
    );

    return res.status(200).send("﻿" + csv);
  } catch (error) {
    next(error);
  }
};

const getDashboardChartData = async (_req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 29);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);

    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().slice(0, 10);
    const endStr = now.toISOString().slice(0, 10);

    const [daily, monthly] = await Promise.all([
      SaleReceipt.findAll({
        where: { date: { [Op.gte]: `${thirtyDaysAgoStr} 00:00:00` } },
        attributes: [
          [fn("DATE", col("date")), "day"],
          [fn("COUNT", col("id")), "nombre_ventes"],
          [fn("COALESCE", fn("SUM", col("total_general")), 0), "total"],
        ],
        group: [fn("DATE", col("date"))],
        order: [[fn("DATE", col("date")), "ASC"]],
        raw: true,
      }),
      SaleReceipt.findAll({
        where: { date: buildDateRange(twelveMonthsAgoStr, endStr) },
        attributes: [
          [fn("DATE_FORMAT", col("date"), "%Y-%m"), "month"],
          [fn("COUNT", col("id")), "nombre_ventes"],
          [fn("COALESCE", fn("SUM", col("total_general")), 0), "total"],
        ],
        group: [fn("DATE_FORMAT", col("date"), "%Y-%m")],
        order: [[fn("DATE_FORMAT", col("date"), "%Y-%m"), "ASC"]],
        raw: true,
      }),
    ]);

    res.status(200).json({ success: true, daily, monthly });
  } catch (error) {
    next(error);
  }
};

const getPaymentBreakdown = async (req, res, next) => {
  try {
    const now = new Date();
    const startDate =
      req.query.startDate ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const endDate = req.query.endDate || now.toISOString().slice(0, 10);

    const breakdown = await SaleReceipt.findAll({
      where: { date: buildDateRange(startDate, endDate) },
      attributes: [
        "mode_paiement",
        [fn("COUNT", col("id")), "nombre_ventes"],
        [fn("COALESCE", fn("SUM", col("total_general")), 0), "total"],
      ],
      group: ["mode_paiement"],
      raw: true,
    });

    res.status(200).json({ success: true, breakdown });
  } catch (error) {
    next(error);
  }
};

const getTopSellers = async (req, res, next) => {
  try {
    const now = new Date();
    const startDate =
      req.query.startDate ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const endDate = req.query.endDate || now.toISOString().slice(0, 10);

    const sellers = await SaleReceipt.findAll({
      where: { date: buildDateRange(startDate, endDate) },
      attributes: [
        "vendeur_id",
        [fn("COUNT", col("SaleReceipt.id")), "nombre_ventes"],
        [fn("COALESCE", fn("SUM", col("total_general")), 0), "total"],
      ],
      include: [{ model: User, as: "vendeur", attributes: ["id", "name"] }],
      group: ["vendeur_id", "vendeur.id", "vendeur.name"],
      order: [[fn("SUM", col("total_general")), "DESC"]],
      limit: 5,
      subQuery: false,
    });

    res.status(200).json({ success: true, sellers });
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
  exportReport,
  getDashboardChartData,
  getPaymentBreakdown,
  getTopSellers,
};
