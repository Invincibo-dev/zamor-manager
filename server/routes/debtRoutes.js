const express = require("express");

const {
  listDebts,
  getDebt,
  createDebt,
  addPayment,
  updateDebt,
  deleteDebt,
} = require("../controllers/debtController");
const { protect } = require("../middleware/authMiddleware");
const { adminOrGestionnaire } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validate");
const {
  createDebtSchema,
  addPaymentSchema,
  updateDebtSchema,
} = require("../validators/debtSchema");

const router = express.Router();

router.use(protect, adminOrGestionnaire);

router.get("/", listDebts);
router.get("/:id", getDebt);
router.post("/", validate(createDebtSchema), createDebt);
router.post("/:id/payments", validate(addPaymentSchema), addPayment);
router.put("/:id", validate(updateDebtSchema), updateDebt);
router.delete("/:id", deleteDebt);

module.exports = router;
