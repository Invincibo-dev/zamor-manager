const express = require("express");

const { createSeller, login, me } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const { loginRateLimit } = require("../middleware/loginRateLimit");

const router = express.Router();

router.post("/register", protect, adminOnly, createSeller);
router.post("/login", loginRateLimit, login);
router.get("/me", protect, me);

module.exports = router;
