const { mysqlPool } = require("../config/database");
const { Recharge, CompanySettings } = require("../models");
const { generateRechargePdf, generateRechargesReportPdf } = require("../utils/pdfGenerator");

const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function buildReportDateRange(query) {
  const { period = "month", date, month, year } = query;
  const now = new Date();
  if (period === "day") {
    const d = date || now.toISOString().slice(0, 10);
    const dateObj = new Date(d + "T12:00:00");
    return {
      from: `${d} 00:00:00`,
      to: `${d} 23:59:59`,
      dateLabel: dateObj.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    };
  }
  const m = String(Number(month || (now.getMonth() + 1))).padStart(2, "0");
  const y = Number(year || now.getFullYear());
  const lastDay = new Date(y, Number(m), 0).getDate();
  return {
    from: `${y}-${m}-01 00:00:00`,
    to: `${y}-${m}-${String(lastDay).padStart(2, "0")} 23:59:59`,
    dateLabel: `${MONTHS_FR[Number(m) - 1]} ${y}`,
  };
}

const generateCode = async () => {
  const year = new Date().getFullYear();
  const [[row]] = await mysqlPool.query(
    "SELECT receipt_code FROM recharges WHERE YEAR(created_at) = ? ORDER BY id DESC LIMIT 1",
    [year]
  );
  const lastSeq = row?.receipt_code ? Number(row.receipt_code.split("-")[2]) : 0;
  return `RCH-${year}-${String(lastSeq + 1).padStart(5, "0")}`;
};

const createRecharge = async (req, res, next) => {
  try {
    // Validation assurée par validate(rechargeSchema) en amont — req.body est déjà coercé et trimmé
    const { company, phone_number, amount } = req.body;

    const receipt_code = await generateCode();

    const rc = await Recharge.create({
      company,
      phone_number,
      amount,
      receipt_code,
      processed_by: req.user.id,
    });

    return res.status(201).json({
      success: true,
      recharge: {
        id: rc.id,
        receipt_code: rc.receipt_code,
        company: rc.company,
        phone_number: rc.phone_number,
        amount: rc.amount,
        created_at: rc.created_at,
        processed_by_name: req.user.name,
      },
    });
  } catch (err) {
    next(err);
  }
};

const listRecharges = async (req, res, next) => {
  try {
    const { from, to, company, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = "WHERE 1=1";
    const params = [];

    if (from) { where += " AND DATE(r.created_at) >= ?"; params.push(from); }
    if (to) { where += " AND DATE(r.created_at) <= ?"; params.push(to); }
    if (company) { where += " AND r.company = ?"; params.push(company); }

    const [[{ total }]] = await mysqlPool.query(
      `SELECT COUNT(*) AS total FROM recharges r ${where}`,
      params
    );

    const [rows] = await mysqlPool.query(
      `SELECT r.*, u.name AS processed_by_name
       FROM recharges r
       LEFT JOIN users u ON u.id = r.processed_by
       ${where}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const [[totals]] = await mysqlPool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_amount FROM recharges r ${where}`,
      params
    );

    return res.json({
      success: true,
      recharges: rows,
      total: Number(total),
      total_amount: Number(totals.total_amount),
      page: Number(page),
      pages: Math.ceil(Number(total) / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

const getRechargePdf = async (req, res, next) => {
  try {
    const { code } = req.params;
    const [[row]] = await mysqlPool.query(
      `SELECT r.*, u.name AS processed_by_name
       FROM recharges r
       LEFT JOIN users u ON u.id = r.processed_by
       WHERE r.receipt_code = ?`,
      [code]
    );
    if (!row) return res.status(404).json({ success: false, message: "Recharge introuvable." });

    if (
      Number(row.processed_by) !== Number(req.user.id) &&
      req.user.role !== "admin" &&
      req.user.role !== "gestionnaire"
    ) {
      return res.status(403).json({ success: false, message: "Accès non autorisé à ce document." });
    }

    const [settings] = await CompanySettings.findAll({ limit: 1, raw: true });
    const buffer = await generateRechargePdf(row, settings || {});

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="recharge-${code}.pdf"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const _fetchRechargesReport = async (query) => {
  const { from, to, dateLabel } = buildReportDateRange(query);
  const [recharges] = await mysqlPool.query(
    `SELECT r.*, u.name AS processed_by_name
     FROM recharges r
     LEFT JOIN users u ON u.id = r.processed_by
     WHERE r.created_at >= ? AND r.created_at <= ?
     ORDER BY r.created_at ASC`,
    [from, to]
  );
  const total = recharges.length;
  const total_amount = recharges.reduce((sum, rc) => sum + Number(rc.amount), 0);
  const breakdown = {};
  for (const rc of recharges) {
    if (!breakdown[rc.company]) breakdown[rc.company] = { count: 0, amount: 0 };
    breakdown[rc.company].count++;
    breakdown[rc.company].amount += Number(rc.amount);
  }
  return { dateLabel, period: { from, to }, total, total_amount, breakdown, recharges };
};

const getRechargesReport = async (req, res, next) => {
  try {
    const report = await _fetchRechargesReport(req.query);
    return res.json({ success: true, ...report });
  } catch (err) {
    next(err);
  }
};

const getRechargesReportPdf = async (req, res, next) => {
  try {
    const report = await _fetchRechargesReport(req.query);
    if (report.total === 0) {
      return res.status(404).json({ success: false, message: "Aucune recharge pour cette période." });
    }
    const [settings] = await CompanySettings.findAll({ limit: 1, raw: true });
    const buffer = await generateRechargesReportPdf(report, settings || {});
    const slug = report.dateLabel.replace(/\s+/g, "-").toLowerCase();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="rapport-recharges-${slug}.pdf"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { createRecharge, listRecharges, getRechargePdf, getRechargesReport, getRechargesReportPdf };
