const express = require("express");

const { createSeller, login, logout, me } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const { loginRateLimit } = require("../middleware/loginRateLimit");
const { validate } = require("../middleware/validate");
const { loginSchema, createSellerSchema } = require("../validators/authSchema");

const router = express.Router();

router.post("/register", protect, adminOnly, validate(createSellerSchema), createSeller);
router.post("/login", loginRateLimit, validate(loginSchema), login);
router.post("/logout", protect, logout);
router.get("/me", protect, me);

module.exports = router;
