const { Router } = require("express");
const { protect } = require("../middleware/authMiddleware");
const { adminOrGestionnaire } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validate");
const { rechargeSchema } = require("../validators/rechargeSchema");
const { createRecharge, listRecharges, getRechargePdf, getRechargesReport, getRechargesReportPdf } = require("../controllers/rechargeController");

const router = Router();

router.post("/", protect, validate(rechargeSchema), createRecharge);
router.get("/report/pdf", protect, adminOrGestionnaire, getRechargesReportPdf);
router.get("/report", protect, adminOrGestionnaire, getRechargesReport);
router.get("/", protect, adminOrGestionnaire, listRecharges);
router.get("/pdf/:code", protect, getRechargePdf);

module.exports = router;
