const { mysqlPool } = require("../config/database");
const { NatcashTransaction, User, CompanySettings } = require("../models");
const { generateNatcashPdf } = require("../utils/pdfGenerator");

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
    const { phone_number, client_name, amount, service_type } = req.body;

    if (!phone_number?.trim()) return res.status(400).json({ success: false, message: "Numéro de téléphone requis." });
    if (!client_name?.trim()) return res.status(400).json({ success: false, message: "Nom du client requis." });
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ success: false, message: "Montant invalide." });
    if (!["depot", "retrait", "transfert"].includes(service_type)) return res.status(400).json({ success: false, message: "Type de service invalide." });

    const receipt_code = await generateCode();

    const tx = await NatcashTransaction.create({
      phone_number: phone_number.trim(),
      client_name: client_name.trim(),
      amount: Number(amount),
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

    const [settings] = await CompanySettings.findAll({ limit: 1, raw: true });
    const buffer = await generateNatcashPdf(row, settings || {});

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="natcash-${code}.pdf"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { createNatcash, listNatcash, getNatcashPdf };
