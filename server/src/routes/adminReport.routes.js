const express = require("express");

const {
  getTodayReport,
  getWeekReport,
  getMonthReport,
  getYearReport,
  getCustomReport,
} = require("../controllers/adminReport.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/reports/today", getTodayReport);
router.get("/reports/week", getWeekReport);
router.get("/reports/month", getMonthReport);
router.get("/reports/year", getYearReport);
router.get("/reports/custom", getCustomReport);

module.exports = router;
