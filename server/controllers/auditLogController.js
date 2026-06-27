const { mysqlPool } = require("../config/database");

const listAuditLogs = async (req, res, next) => {
  try {
    const { table_name, action, changed_by, from, to, page = 1, limit = 50 } = req.query;
    const offset = (Math.max(1, Number(page)) - 1) * Math.min(100, Number(limit));
    const safeLimit = Math.min(100, Number(limit));

    let where = "WHERE 1=1";
    const params = [];

    if (table_name) { where += " AND a.table_name = ?"; params.push(table_name); }
    if (action) { where += " AND a.action = ?"; params.push(action); }
    if (changed_by) { where += " AND a.changed_by = ?"; params.push(Number(changed_by)); }
    if (from) { where += " AND DATE(a.created_at) >= ?"; params.push(from); }
    if (to) { where += " AND DATE(a.created_at) <= ?"; params.push(to); }

    const [[{ total }]] = await mysqlPool.query(
      `SELECT COUNT(*) AS total FROM audit_log a ${where}`,
      params
    );

    const [logs] = await mysqlPool.query(
      `SELECT a.*, u.name AS changed_by_name
       FROM audit_log a
       LEFT JOIN users u ON u.id = a.changed_by
       ${where}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    return res.json({
      success: true,
      logs,
      total: Number(total),
      page: Math.max(1, Number(page)),
      pages: Math.ceil(Number(total) / safeLimit),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listAuditLogs };
