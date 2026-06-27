const { Router } = require("express");
const { protect } = require("../middleware/authMiddleware");
const { adminOrGestionnaire } = require("../middleware/roleMiddleware");
const { createNatcash, listNatcash, getNatcashPdf, getNatcashReport, getNatcashReportPdf } = require("../controllers/natcashController");

const router = Router();

router.post("/", protect, createNatcash);
router.get("/report/pdf", protect, adminOrGestionnaire, getNatcashReportPdf);
router.get("/report", protect, adminOrGestionnaire, getNatcashReport);
router.get("/", protect, adminOrGestionnaire, listNatcash);
router.get("/pdf/:code", protect, getNatcashPdf);

module.exports = router;
