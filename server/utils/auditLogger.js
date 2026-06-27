const { mysqlPool } = require("../config/database");
const appLogger = require("./logger");

/**
 * Écrit une entrée dans audit_log.
 * Non-bloquant : les erreurs sont loguées mais ne rejettent pas la requête principale.
 */
const logAudit = async ({ tableName, recordId, action, changedBy, oldValues, newValues, ip }) => {
  try {
    await mysqlPool.query(
      `INSERT INTO audit_log
         (table_name, record_id, action, changed_by, old_values, new_values, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        tableName,
        recordId,
        action,
        changedBy ?? null,
        oldValues != null ? JSON.stringify(oldValues) : null,
        newValues != null ? JSON.stringify(newValues) : null,
        ip ?? null,
      ]
    );
  } catch (err) {
    appLogger.warn(`[audit] Échec journalisation ${action} sur ${tableName}#${recordId}: ${err.message}`);
  }
};

module.exports = { logAudit };
