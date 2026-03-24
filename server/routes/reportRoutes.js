const express = require("express");

const {
  getCustomReport,
  getDailyReport,
  getMonthlyReport,
  getWeeklyReport,
  getYearlyReport,
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/daily", getDailyReport);
router.get("/weekly", getWeeklyReport);
router.get("/monthly", getMonthlyReport);
router.get("/yearly", getYearlyReport);
router.get("/custom", getCustomReport);

module.exports = router;
