const { pool } = require("../config/db");

const RECEIPTS_TABLE = "sale_receipts";
const ITEMS_TABLE = "sale_receipt_items";

const createReceiptsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS ${RECEIPTS_TABLE} (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      code_recu VARCHAR(20) NOT NULL UNIQUE,
      vendeur_id INT UNSIGNED NOT NULL,
      sale_date DATETIME NOT NULL,
      total_general DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
      mode_paiement VARCHAR(50) NOT NULL,
      signature_vendeur VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_sale_receipts_vendeur
        FOREIGN KEY (vendeur_id) REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
    )
  `;

  await pool.execute(query);
};

const createReceiptItemsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS ${ITEMS_TABLE} (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sale_receipt_id INT UNSIGNED NOT NULL,
      nom_produit VARCHAR(255) NOT NULL,
      quantite INT UNSIGNED NOT NULL,
      prix_unitaire DECIMAL(12, 2) NOT NULL,
      total DECIMAL(12, 2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_sale_receipt_items_receipt
        FOREIGN KEY (sale_receipt_id) REFERENCES ${RECEIPTS_TABLE}(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    )
  `;

  await pool.execute(query);
};

const findById = async (id) => {
  const [receiptRows] = await pool.execute(
    `SELECT sr.id, sr.code_recu, sr.vendeur_id, sr.sale_date AS date, sr.total_general, sr.mode_paiement, sr.signature_vendeur, sr.created_at, sr.updated_at,
            u.name AS vendeur_nom
     FROM ${RECEIPTS_TABLE} sr
     INNER JOIN users u ON u.id = sr.vendeur_id
     WHERE sr.id = ?
     LIMIT 1`,
    [id]
  );

  const receipt = receiptRows[0];

  if (!receipt) {
    return null;
  }

  const [itemRows] = await pool.execute(
    `SELECT id, sale_receipt_id, nom_produit, quantite, prix_unitaire, total, created_at, updated_at
     FROM ${ITEMS_TABLE}
     WHERE sale_receipt_id = ?
     ORDER BY id ASC`,
    [id]
  );

  return {
    ...receipt,
    produits: itemRows,
  };
};

const findByCode = async (codeRecu) => {
  const [receiptRows] = await pool.execute(
    `SELECT sr.id, sr.code_recu, sr.vendeur_id, sr.sale_date AS date, sr.total_general, sr.mode_paiement, sr.signature_vendeur, sr.created_at, sr.updated_at,
            u.name AS vendeur_nom
     FROM ${RECEIPTS_TABLE} sr
     INNER JOIN users u ON u.id = sr.vendeur_id
     WHERE sr.code_recu = ?
     LIMIT 1`,
    [codeRecu]
  );

  const receipt = receiptRows[0];

  if (!receipt) {
    return null;
  }

  const [itemRows] = await pool.execute(
    `SELECT id, sale_receipt_id, nom_produit, quantite, prix_unitaire, total, created_at, updated_at
     FROM ${ITEMS_TABLE}
     WHERE sale_receipt_id = ?
     ORDER BY id ASC`,
    [receipt.id]
  );

  return {
    ...receipt,
    produits: itemRows,
  };
};

const findBySeller = async (vendeurId) => {
  const [rows] = await pool.execute(
    `SELECT sr.id, sr.code_recu, sr.vendeur_id, sr.sale_date AS date, sr.total_general, sr.mode_paiement, sr.signature_vendeur, sr.created_at, sr.updated_at,
            u.name AS vendeur_nom
     FROM ${RECEIPTS_TABLE} sr
     INNER JOIN users u ON u.id = sr.vendeur_id
     WHERE sr.vendeur_id = ?
     ORDER BY sr.sale_date DESC, sr.id DESC`,
    [vendeurId]
  );

  return rows;
};

const findByDateRange = async ({ startDate, endDate, vendeurId = null }) => {
  let query = `
    SELECT sr.id, sr.code_recu, sr.vendeur_id, sr.sale_date AS date, sr.total_general, sr.mode_paiement, sr.signature_vendeur, sr.created_at, sr.updated_at,
           u.name AS vendeur_nom
    FROM ${RECEIPTS_TABLE} sr
    INNER JOIN users u ON u.id = sr.vendeur_id
    WHERE sr.sale_date BETWEEN ? AND ?
  `;
  const params = [startDate, endDate];

  if (vendeurId) {
    query += " AND sr.vendeur_id = ?";
    params.push(vendeurId);
  }

  query += " ORDER BY sr.sale_date DESC, sr.id DESC";

  const [rows] = await pool.execute(query, params);
  return rows;
};

const getSalesSummaryBetweenDates = async ({ startDate, endDate }) => {
  const [rows] = await pool.execute(
    `SELECT
       COUNT(*) AS nombre_ventes,
       COALESCE(SUM(total_general), 0) AS chiffre_affaires_total
     FROM ${RECEIPTS_TABLE}
     WHERE sale_date BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  return rows[0];
};

module.exports = {
  RECEIPTS_TABLE,
  ITEMS_TABLE,
  createReceiptsTable,
  createReceiptItemsTable,
  findById,
  findByCode,
  findBySeller,
  findByDateRange,
  getSalesSummaryBetweenDates,
};
