/**
 * Génère server/database/schema.sql à partir de la vraie structure de la base.
 * Utilise SHOW CREATE TABLE pour refléter exactement l'état live de la DB.
 *
 * Usage:
 *   cd server
 *   node scripts/generate-schema.js > database/schema.sql
 *
 * Prérequis: variables d'environnement DB_* disponibles (ou .env à la racine du serveur).
 */

require("dotenv").config();

const mysql = require("mysql2/promise");

const TABLES = ["users", "sale_receipts", "receipt_items"];

const header = `-- Zamor Manager — Database Schema
-- Généré automatiquement via: node server/scripts/generate-schema.js > server/database/schema.sql
-- Date: ${new Date().toISOString().slice(0, 10)}
-- NE PAS MODIFIER MANUELLEMENT — relancer le script après chaque changement de modèle.

SET FOREIGN_KEY_CHECKS = 0;
`;

const footer = `
SET FOREIGN_KEY_CHECKS = 1;
`;

async function generateSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "zamor_manager",
  });

  try {
    const sections = [header];

    for (const table of TABLES) {
      const [[row]] = await connection.query(`SHOW CREATE TABLE \`${table}\``);
      const createStatement = row["Create Table"];

      // Ajoute IF NOT EXISTS pour que le fichier soit idempotent
      const idempotent = createStatement.replace(
        /^CREATE TABLE `/,
        "CREATE TABLE IF NOT EXISTS `"
      );

      sections.push(`\n-- Table: ${table}\n${idempotent};\n`);
    }

    sections.push(footer);
    process.stdout.write(sections.join("\n"));
  } finally {
    await connection.end();
  }
}

generateSchema().catch((err) => {
  process.stderr.write(`Erreur: ${err.message}\n`);
  process.exit(1);
});
