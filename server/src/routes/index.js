const express = require("express");
const authRoutes = require("./auth.routes");
const saleReceiptRoutes = require("./saleReceipt.routes");
const adminReportRoutes = require("./adminReport.routes");
const receiptPdfRoutes = require("./receiptPdf.routes");

const router = express.Router();

router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Zamor Manager API base route",
  });
});

router.use("/auth", authRoutes);
router.use("/sales", saleReceiptRoutes);
router.use("/admin", adminReportRoutes);
router.use("/receipt", receiptPdfRoutes);

module.exports = router;
