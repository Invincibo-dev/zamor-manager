const path = require("path");
const fs = require("fs");

const { mysqlPool } = require("../config/database");
const { listBackups, BACKUPS_DIR } = require("../utils/scheduler");
const appLogger = require("../utils/logger");

const sqlVal = (val) => {
  if (val === null || val === undefined) return "NULL";
  if (val instanceof Date) {
    return `'${val.toISOString().slice(0, 19).replace("T", " ")}'`;
  }
  if (typeof val === "number" || typeof val === "bigint") return String(val);
  if (typeof val === "boolean") return val ? "1" : "0";
  if (Buffer.isBuffer(val)) return `X'${val.toString("hex")}'`;
  const s = String(val)
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\x00/g, "\\0")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
  return `'${s}'`;
};

const downloadBackup = async (req, res, next) => {
  const date = new Date().toISOString().slice(0, 19).replace(/[T:]/g, "-");
  const filename = `zamor-backup-${date}.sql`;

  res.setHeader("Content-Type", "application/sql; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  try {
    res.write(
      `-- Zamor Manager Backup\n` +
      `-- Generated: ${new Date().toISOString()}\n\n` +
      `SET NAMES utf8mb4;\n` +
      `SET FOREIGN_KEY_CHECKS = 0;\n\n`
    );

    const [tables] = await mysqlPool.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`
    );

    for (const { TABLE_NAME } of tables) {
      // Structure
      const [[createRow]] = await mysqlPool.query(
        `SHOW CREATE TABLE \`${TABLE_NAME}\``
      );
      res.write(`-- Table: ${TABLE_NAME}\n`);
      res.write(`DROP TABLE IF EXISTS \`${TABLE_NAME}\`;\n`);
      res.write(`${createRow["Create Table"]};\n\n`);

      // Data — batched to avoid loading all rows in memory
      const BATCH = 1000;
      let offset = 0;
      let totalRows = 0;

      while (true) {
        const [rows] = await mysqlPool.query(
          `SELECT * FROM \`${TABLE_NAME}\` LIMIT ? OFFSET ?`,
          [BATCH, offset]
        );

        if (rows.length === 0) break;

        const cols = Object.keys(rows[0])
          .map((c) => `\`${c}\``)
          .join(", ");

        const values = rows
          .map((row) => {
            // Colonne password : remplacée par '[REDACTED]' pour protéger les hachages bcrypt
            const safe = TABLE_NAME === "users" ? { ...row, password: "[REDACTED]" } : row;
            return `(${Object.values(safe).map(sqlVal).join(", ")})`;
          })
          .join(",\n");

        res.write(`INSERT INTO \`${TABLE_NAME}\` (${cols}) VALUES\n${values};\n\n`);

        totalRows += rows.length;
        if (rows.length < BATCH) break;
        offset += BATCH;
      }

      if (totalRows > 0) {
        res.write(`-- ${totalRows} row(s) exported from ${TABLE_NAME}\n\n`);
      }
    }

    res.write(`SET FOREIGN_KEY_CHECKS = 1;\n`);
    res.write(`-- Backup complete\n`);
    res.end();

    appLogger.info(`Backup téléchargé par l'utilisateur ${req.user?.id} (${req.user?.email})`);
  } catch (err) {
    if (!res.headersSent) {
      next(err);
    } else {
      appLogger.error("Backup error after headers sent:", err.message);
      res.end();
    }
  }
};

const getBackupList = (req, res) => {
  res.json({ success: true, backups: listBackups() });
};

const downloadSavedBackup = (req, res, next) => {
  const { filename } = req.params;
  // Sécurité : empêcher traversal de chemin
  if (!filename.endsWith(".sql") || filename.includes("/") || filename.includes("..")) {
    return res.status(400).json({ success: false, message: "Nom de fichier invalide." });
  }
  const filepath = path.join(BACKUPS_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ success: false, message: "Fichier introuvable." });
  }
  res.setHeader("Content-Type", "application/sql");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  fs.createReadStream(filepath).pipe(res);
};

module.exports = { downloadBackup, getBackupList, downloadSavedBackup };
