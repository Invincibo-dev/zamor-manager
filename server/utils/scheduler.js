/**
 * Sauvegarde automatique journalière — s'exécute chaque jour à 2h00 UTC.
 * Écrit le fichier dans ./backups/ (créé si absent).
 * Sur Render (filesystem éphémère), les fichiers sont perdus à chaque redéploiement —
 * utiliser le bouton "Télécharger sauvegarde" dans les paramètres pour les garder.
 */

const fs = require("fs");
const path = require("path");

const { mysqlPool } = require("../config/database");
const appLogger = require("./logger");

const BACKUPS_DIR = path.join(__dirname, "..", "backups");
const KEEP_DAYS = 7;

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

const runBackup = async () => {
  const startedAt = Date.now();
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `zamor-backup-${dateStr}.sql`;
  const filepath = path.join(BACKUPS_DIR, filename);

  try {
    if (!fs.existsSync(BACKUPS_DIR)) fs.mkdirSync(BACKUPS_DIR, { recursive: true });

    const stream = fs.createWriteStream(filepath, { encoding: "utf8" });

    const write = (s) =>
      new Promise((resolve, reject) =>
        stream.write(s, (err) => (err ? reject(err) : resolve()))
      );

    await write(
      `-- Zamor Manager Auto Backup\n-- Date: ${new Date().toISOString()}\n\n` +
      `SET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS = 0;\n\n`
    );

    const [tables] = await mysqlPool.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`
    );

    let totalRows = 0;

    for (const { TABLE_NAME } of tables) {
      const [[createRow]] = await mysqlPool.query(`SHOW CREATE TABLE \`${TABLE_NAME}\``);
      await write(`DROP TABLE IF EXISTS \`${TABLE_NAME}\`;\n${createRow["Create Table"]};\n\n`);

      const BATCH = 1000;
      let offset = 0;

      while (true) {
        const [rows] = await mysqlPool.query(
          `SELECT * FROM \`${TABLE_NAME}\` LIMIT ? OFFSET ?`,
          [BATCH, offset]
        );
        if (rows.length === 0) break;

        const cols = Object.keys(rows[0]).map((c) => `\`${c}\``).join(", ");
        const values = rows
          .map((row) => {
            // Colonne password redactée pour protéger les hachages bcrypt dans le fichier backup
            const safe = TABLE_NAME === "users" ? { ...row, password: "[REDACTED]" } : row;
            return `(${Object.values(safe).map(sqlVal).join(", ")})`;
          })
          .join(",\n");

        await write(`INSERT INTO \`${TABLE_NAME}\` (${cols}) VALUES\n${values};\n\n`);
        totalRows += rows.length;
        if (rows.length < BATCH) break;
        offset += BATCH;
      }
    }

    await write(`SET FOREIGN_KEY_CHECKS = 1;\n-- Backup complete (${totalRows} rows)\n`);

    await new Promise((resolve, reject) =>
      stream.end((err) => (err ? reject(err) : resolve()))
    );

    const sizeKb = Math.round(fs.statSync(filepath).size / 1024);
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    appLogger.info(
      `Backup auto OK → ${filename} (${sizeKb} KB, ${totalRows} lignes, ${elapsed}s)`
    );

    pruneOldBackups();
  } catch (err) {
    appLogger.error(`Backup auto ERREUR: ${err.message}`);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  }
};

const pruneOldBackups = () => {
  try {
    const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
    fs.readdirSync(BACKUPS_DIR).forEach((file) => {
      const fp = path.join(BACKUPS_DIR, file);
      if (fs.statSync(fp).mtimeMs < cutoff) {
        fs.unlinkSync(fp);
        appLogger.info(`Backup ancien supprimé : ${file}`);
      }
    });
  } catch {
    // non-critique
  }
};

const scheduleBackup = () => {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(2, 0, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);

  const delayMs = next - now;

  setTimeout(async () => {
    await runBackup();
    scheduleBackup();
  }, delayMs);

  appLogger.info(`Backup auto planifié pour ${next.toISOString()}`);
};

// D2 : Purge hebdomadaire — supprime les entrées login_history > 6 mois
const purgeLoginHistory = async () => {
  try {
    const [result] = await mysqlPool.query(
      "DELETE FROM login_history WHERE created_at < DATE_SUB(NOW(), INTERVAL 6 MONTH)"
    );
    if (result.affectedRows > 0) {
      appLogger.info(`Purge login_history : ${result.affectedRows} entrée(s) supprimée(s).`);
    }
  } catch (err) {
    appLogger.error(`Purge login_history ERREUR: ${err.message}`);
  }
};

const scheduleLoginHistoryPurge = () => {
  // Exécution immédiate, puis toutes les 7 jours
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  purgeLoginHistory();
  setInterval(purgeLoginHistory, WEEK_MS);
  appLogger.info("Purge login_history planifiée (hebdomadaire).");
};

const listBackups = () => {
  if (!fs.existsSync(BACKUPS_DIR)) return [];
  return fs
    .readdirSync(BACKUPS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => {
      const stats = fs.statSync(path.join(BACKUPS_DIR, f));
      return { name: f, size: stats.size, date: stats.mtime.toISOString() };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
};

module.exports = { scheduleBackup, scheduleLoginHistoryPurge, runBackup, listBackups, BACKUPS_DIR };
