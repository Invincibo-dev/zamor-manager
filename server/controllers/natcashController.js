const { mysqlPool } = require("../config/database");
const { NatcashTransaction, User, CompanySettings } = require("../models");
const { generateNatcashPdf, generateNatcashReportPdf } = require("../utils/pdfGenerator");

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
    "SELECT receipt_code FROM natcash_transactions WHERE YEAR(created_at) = ? ORDER BY id DESC LIMIT 1",
    [year]
  );
  const lastSeq = row?.receipt_code ? Number(row.receipt_code.split("-")[2]) : 0;
  return `NAT-${year}-${String(lastSeq + 1).padStart(5, "0")}`;
};

const createNatcash = async (req, res, next) => {
  try {
    // Validation assurée par validate(natcashSchema) en amont — req.body est déjà coercé et trimmé
    const { phone_number, client_name, amount, service_type } = req.body;

    const receipt_code = await generateCode();

    const tx = await NatcashTransaction.create({
      phone_number,
      client_name,
      amount,
      service_type,
      receipt_code,
      processed_by: req.user.id,
    });

    return res.status(201).json({
      success: true,
      transaction: {
        id: tx.id,
        receipt_code: tx.receipt_code,
        phone_number: tx.phone_number,
        client_name: tx.client_name,
        amount: tx.amount,
        service_type: tx.service_type,
        created_at: tx.created_at,
        processed_by_name: req.user.name,
      },
    });
  } catch (err) {
    next(err);
  }
};

const listNatcash = async (req, res, next) => {
  try {
    const { from, to, service_type, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let where = "WHERE 1=1";
    const params = [];

    if (from) { where += " AND DATE(n.created_at) >= ?"; params.push(from); }
    if (to) { where += " AND DATE(n.created_at) <= ?"; params.push(to); }
    if (service_type) { where += " AND n.service_type = ?"; params.push(service_type); }

    const [[{ total }]] = await mysqlPool.query(
      `SELECT COUNT(*) AS total FROM natcash_transactions n ${where}`,
      params
    );

    const [rows] = await mysqlPool.query(
      `SELECT n.*, u.name AS processed_by_name
       FROM natcash_transactions n
       LEFT JOIN users u ON u.id = n.processed_by
       ${where}
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    const [[totals]] = await mysqlPool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_amount FROM natcash_transactions n ${where}`,
      params
    );

    return res.json({
      success: true,
      transactions: rows,
      total: Number(total),
      total_amount: Number(totals.total_amount),
      page: Number(page),
      pages: Math.ceil(Number(total) / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

const getNatcashPdf = async (req, res, next) => {
  try {
    const { code } = req.params;
    const [[row]] = await mysqlPool.query(
      `SELECT n.*, u.name AS processed_by_name
       FROM natcash_transactions n
       LEFT JOIN users u ON u.id = n.processed_by
       WHERE n.receipt_code = ?`,
      [code]
    );
    if (!row) return res.status(404).json({ success: false, message: "Transaction introuvable." });

    if (
      Number(row.processed_by) !== Number(req.user.id) &&
      req.user.role !== "admin" &&
      req.user.role !== "gestionnaire"
    ) {
      return res.status(403).json({ success: false, message: "Accès non autorisé à ce document." });
    }

    const [settings] = await CompanySettings.findAll({ limit: 1, raw: true });
    const buffer = await generateNatcashPdf(row, settings || {});

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="natcash-${code}.pdf"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const _fetchNatcashReport = async (query) => {
  const { from, to, dateLabel } = buildReportDateRange(query);
  const [transactions] = await mysqlPool.query(
    `SELECT n.*, u.name AS processed_by_name
     FROM natcash_transactions n
     LEFT JOIN users u ON u.id = n.processed_by
     WHERE n.created_at >= ? AND n.created_at <= ?
     ORDER BY n.created_at ASC`,
    [from, to]
  );
  const total = transactions.length;
  const total_amount = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const breakdown = {};
  for (const tx of transactions) {
    if (!breakdown[tx.service_type]) breakdown[tx.service_type] = { count: 0, amount: 0 };
    breakdown[tx.service_type].count++;
    breakdown[tx.service_type].amount += Number(tx.amount);
  }
  return { dateLabel, period: { from, to }, total, total_amount, breakdown, transactions };
};

const getNatcashReport = async (req, res, next) => {
  try {
    const report = await _fetchNatcashReport(req.query);
    return res.json({ success: true, ...report });
  } catch (err) {
    next(err);
  }
};

const getNatcashReportPdf = async (req, res, next) => {
  try {
    const report = await _fetchNatcashReport(req.query);
    if (report.total === 0) {
      return res.status(404).json({ success: false, message: "Aucune transaction pour cette période." });
    }
    const [settings] = await CompanySettings.findAll({ limit: 1, raw: true });
    const buffer = await generateNatcashReportPdf(report, settings || {});
    const slug = report.dateLabel.replace(/\s+/g, "-").toLowerCase();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="rapport-natcash-${slug}.pdf"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { createNatcash, listNatcash, getNatcashPdf, getNatcashReport, getNatcashReportPdf };
