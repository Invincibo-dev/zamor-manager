const express = require("express");

const {
  createSale,
  getSaleByCode,
  getSalePdf,
  getSales,
  getSalesBySeller,
} = require("../controllers/saleController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/").post(createSale).get(getSales);
router.get("/code/:code", getSaleByCode);
router.get("/seller/:sellerId", getSalesBySeller);
router.get("/pdf/:code", getSalePdf);

module.exports = router;
