const { mysqlPool } = require("../config/database");
const { Recharge, CompanySettings } = require("../models");
const { generateRechargePdf } = require("../utils/pdfGenerator");

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
    const { company, phone_number, amount } = req.body;

    if (!["natcom", "digicel"].includes(company)) return res.status(400).json({ success: false, message: "Compagnie invalide (natcom ou digicel)." });
    if (!phone_number?.trim()) return res.status(400).json({ success: false, message: "Numéro de téléphone requis." });
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ success: false, message: "Montant invalide." });

    const receipt_code = await generateCode();

    const rc = await Recharge.create({
      company,
      phone_number: phone_number.trim(),
      amount: Number(amount),
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

    const [settings] = await CompanySettings.findAll({ limit: 1, raw: true });
    const buffer = await generateRechargePdf(row, settings || {});

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="recharge-${code}.pdf"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { createRecharge, listRecharges, getRechargePdf };
