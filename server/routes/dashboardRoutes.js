const express = require("express");
const { getDashboard } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");
const { adminOrGestionnaire } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, adminOrGestionnaire);

router.get("/", getDashboard);

module.exports = router;
