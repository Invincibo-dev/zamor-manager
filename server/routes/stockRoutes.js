const express = require("express");
const { restock } = require("../controllers/stockController");
const { protect } = require("../middleware/authMiddleware");
const { adminOrGestionnaire } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validate");
const { restockSchema } = require("../validators/stockSchema");

const router = express.Router();

router.use(protect, adminOrGestionnaire);

router.post("/restock", validate(restockSchema), restock);

module.exports = router;
