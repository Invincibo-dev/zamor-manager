const { Router } = require("express");
const { protect } = require("../middleware/authMiddleware");
const { adminOrGestionnaire } = require("../middleware/roleMiddleware");
const { createRecharge, listRecharges, getRechargePdf } = require("../controllers/rechargeController");

const router = Router();

router.post("/", protect, createRecharge);
router.get("/", protect, adminOrGestionnaire, listRecharges);
router.get("/pdf/:code", protect, getRechargePdf);

module.exports = router;
