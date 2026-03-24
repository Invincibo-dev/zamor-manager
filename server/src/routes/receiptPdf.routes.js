const express = require("express");

const { getReceiptPdf } = require("../controllers/receiptPdf.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/pdf/:code", protect, getReceiptPdf);

module.exports = router;
