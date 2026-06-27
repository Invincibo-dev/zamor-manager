const { Router } = require("express");
const { protect } = require("../middleware/authMiddleware");
const { adminOrGestionnaire } = require("../middleware/roleMiddleware");
const { createNatcash, listNatcash, getNatcashPdf } = require("../controllers/natcashController");

const router = Router();

router.post("/", protect, createNatcash);
router.get("/", protect, adminOrGestionnaire, listNatcash);
router.get("/pdf/:code", protect, getNatcashPdf);

module.exports = router;
