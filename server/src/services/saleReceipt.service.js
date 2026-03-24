const { pool } = require("../config/db");

const buildSaleCode = (year, sequenceNumber) => {
  return `ZMR-${year}-${String(sequenceNumber).padStart(5, "0")}`;
};

const generateCodeRecu = async (connection, saleDate) => {
  const year = new Date(saleDate).getFullYear();

  const [rows] = await connection.execute(
    `SELECT code_recu
     FROM sale_receipts
     WHERE code_recu LIKE ?
     ORDER BY id DESC
     LIMIT 1`,
    [`ZMR-${year}-%`]
  );

  const lastCode = rows[0]?.code_recu;
  const lastSequence = lastCode ? Number(lastCode.split("-")[2]) : 0;

  return buildSaleCode(year, lastSequence + 1);
};

const createSaleReceipt = async ({
  vendeurId,
  date,
  produits,
  totalGeneral,
  modePaiement,
  signatureVendeur,
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const codeRecu = await generateCodeRecu(connection, date);

    const [receiptResult] = await connection.execute(
      `INSERT INTO sale_receipts (code_recu, vendeur_id, sale_date, total_general, mode_paiement, signature_vendeur)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        codeRecu,
        vendeurId,
        date,
        totalGeneral,
        modePaiement,
        signatureVendeur || null,
      ]
    );

    for (const produit of produits) {
      await connection.execute(
        `INSERT INTO sale_receipt_items (sale_receipt_id, nom_produit, quantite, prix_unitaire, total)
         VALUES (?, ?, ?, ?, ?)`,
        [
          receiptResult.insertId,
          produit.nom_produit,
          produit.quantite,
          produit.prix_unitaire,
          produit.total,
        ]
      );
    }

    await connection.commit();

    return {
      id: receiptResult.insertId,
      code_recu: codeRecu,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  createSaleReceipt,
  generateCodeRecu,
};
