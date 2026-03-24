const express = require("express");

const { login, me, register } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { loginRateLimit } = require("../middleware/loginRateLimit");

const router = express.Router();

router.post("/register", register);
router.post("/login", loginRateLimit, login);
router.get("/me", protect, me);

module.exports = router;
