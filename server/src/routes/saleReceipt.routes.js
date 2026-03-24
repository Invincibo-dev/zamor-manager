const express = require("express");

const {
  createReceipt,
  getReceiptByCode,
  getSalesBySeller,
  getSalesByDate,
} = require("../controllers/saleReceipt.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", protect, createReceipt);
router.get("/code/:code", protect, getReceiptByCode);
router.get("/seller/:vendeurId", protect, getSalesBySeller);
router.get("/date/filter", protect, getSalesByDate);

module.exports = router;
