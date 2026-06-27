const express = require("express");

const {
  getCustomReport,
  getDailyReport,
  getMonthlyReport,
  getWeeklyReport,
  getYearlyReport,
  exportReport,
  getDashboardChartData,
  getPaymentBreakdown,
  getTopSellers,
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");
const { adminOrGestionnaire } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, adminOrGestionnaire);

router.get("/daily", getDailyReport);
router.get("/weekly", getWeeklyReport);
router.get("/monthly", getMonthlyReport);
router.get("/yearly", getYearlyReport);
router.get("/custom", getCustomReport);
router.get("/export", exportReport);
router.get("/chart-data", getDashboardChartData);
router.get("/payment-breakdown", getPaymentBreakdown);
router.get("/top-sellers", getTopSellers);

module.exports = router;
