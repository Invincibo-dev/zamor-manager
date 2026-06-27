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

const header = `-- Zamor Manager — Database Schema
-- Généré automatiquement via: node server/scripts/generate-schema.js > server/database/schema.sql
-- Date: ${new Date().toISOString().slice(0, 10)}
-- NE PAS MODIFIER MANUELLEMENT — relancer le script après chaque changement de modèle.

SET NAMES utf8mb4;
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
    // Découverte automatique de toutes les tables (ordre alphabétique)
    const [tables] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`
    );

    const sections = [header];

    for (const { TABLE_NAME } of tables) {
      const [[row]] = await connection.query(`SHOW CREATE TABLE \`${TABLE_NAME}\``);
      const createStatement = row["Create Table"];

      // Ajoute IF NOT EXISTS pour que le fichier soit idempotent
      const idempotent = createStatement.replace(
        /^CREATE TABLE `/,
        "CREATE TABLE IF NOT EXISTS `"
      );

      sections.push(`\n-- Table: ${TABLE_NAME}\n${idempotent};\n`);
    }

    sections.push(footer);
    process.stdout.write(sections.join("\n"));

    process.stderr.write(
      `[schema] ${tables.length} table(s) exportée(s): ${tables.map((t) => t.TABLE_NAME).join(", ")}\n`
    );
  } finally {
    await connection.end();
  }
}

generateSchema().catch((err) => {
  process.stderr.write(`Erreur: ${err.message}\n`);
  process.exit(1);
});
