const express = require("express");

const { listHistory } = require("../controllers/loginHistoryController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/", listHistory);

module.exports = router;
