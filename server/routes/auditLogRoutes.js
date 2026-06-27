const { Router } = require("express");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const { listAuditLogs } = require("../controllers/auditLogController");

const router = Router();

// Lecture seule — aucune route de modification ou suppression intentionnellement
router.get("/", protect, adminOnly, listAuditLogs);

module.exports = router;
