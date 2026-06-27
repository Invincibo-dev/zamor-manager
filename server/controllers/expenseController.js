const { Op } = require("sequelize");
const { mysqlPool } = require("../config/database");
const { Expense } = require("../models");

const MAX_LIMIT = 200;

const listExpenses = async (req, res, next) => {
  try {
    const { categorie, from, to } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;

    const where = {};
    if (categorie) where.categorie = categorie;
    if (from || to) {
      where.date_depense = {};
      if (from) where.date_depense[Op.gte] = from;
      if (to) where.date_depense[Op.lte] = to;
    }

    const { count, rows } = await Expense.findAndCountAll({
      where,
      order: [["date_depense", "DESC"], ["created_at", "DESC"]],
      limit,
      offset,
    });

    res.json({ success: true, expenses: rows, total: count, page, limit });
  } catch (err) {
    next(err);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "Les paramètres from et to sont requis (AAAA-MM-JJ).",
      });
    }

    const [[revenueRow]] = await mysqlPool.query(
      `SELECT
         COALESCE(SUM(
           ri.quantite * ri.prix_unitaire *
           CASE WHEN sr.devise = 'USD' THEN COALESCE(sr.taux_change, 132) ELSE 1 END
         ), 0) AS total,
         COUNT(DISTINCT sr.id) AS nb_ventes
       FROM receipt_items ri
       JOIN sale_receipts sr ON sr.id = ri.receipt_id
       WHERE DATE(sr.date) BETWEEN ? AND ?`,
      [from, to]
    );

    const [[expenseRow]] = await mysqlPool.query(
      `SELECT COALESCE(SUM(montant), 0) AS total FROM expenses
       WHERE date_depense BETWEEN ? AND ?`,
      [from, to]
    );

    const [categories] = await mysqlPool.query(
      `SELECT categorie, COALESCE(SUM(montant), 0) AS total
       FROM expenses
       WHERE date_depense BETWEEN ? AND ?
       GROUP BY categorie
       ORDER BY total DESC`,
      [from, to]
    );

    const revenus = Number(revenueRow.total);
    const depenses = Number(expenseRow.total);

    res.json({
      success: true,
      periode: { from, to },
      revenus,
      depenses,
      benefice: revenus - depenses,
      nb_ventes: Number(revenueRow.nb_ventes),
      depenses_par_categorie: categories.map((r) => ({
        categorie: r.categorie,
        total: Number(r.total),
      })),
    });
  } catch (err) {
    next(err);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const { categorie, montant, date_depense, note } = req.body;
    const expense = await Expense.create({
      categorie,
      montant,
      date_depense,
      note: note || null,
      created_by: req.user.id,
    });
    res.status(201).json({ success: true, expense });
  } catch (err) {
    next(err);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Dépense introuvable." });
    }
    await expense.update(req.body);
    res.json({ success: true, expense });
  } catch (err) {
    next(err);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Dépense introuvable." });
    }
    await expense.destroy();
    res.json({ success: true, message: "Dépense supprimée." });
  } catch (err) {
    next(err);
  }
};

const exportExpensesCSV = async (req, res, next) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      success: false,
      message: "Les paramètres from et to sont requis.",
    });
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="depenses_${from}_${to}.csv"`
  );

  res.write("﻿");
  res.write('"Date","Catégorie","Montant","Note"\r\n');

  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const BATCH = 500;
  let offset = 0;

  try {
    while (true) {
      const [rows] = await mysqlPool.query(
        `SELECT date_depense, categorie, montant, note
         FROM expenses
         WHERE date_depense BETWEEN ? AND ?
         ORDER BY date_depense DESC, id DESC
         LIMIT ? OFFSET ?`,
        [from, to, BATCH, offset]
      );

      for (const r of rows) {
        res.write(
          [
            escape(r.date_depense),
            escape(r.categorie),
            escape(r.montant),
            escape(r.note),
          ].join(",") + "\r\n"
        );
      }

      if (rows.length < BATCH) break;
      offset += BATCH;
    }

    res.end();
  } catch (error) {
    if (!res.headersSent) next(error);
    else res.end();
  }
};

module.exports = {
  listExpenses,
  getSummary,
  createExpense,
  updateExpense,
  deleteExpense,
  exportExpensesCSV,
};
