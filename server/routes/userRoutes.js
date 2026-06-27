const express = require("express");

const {
  createSeller,
  listUsers,
  resetSellerPassword,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validate");
const { createSellerSchema, resetPasswordSchema } = require("../validators/userSchema");

const router = express.Router();

router.get("/", protect, listUsers);
router.post("/create-seller", protect, adminOnly, validate(createSellerSchema), createSeller);
router.put("/:id/reset-password", protect, adminOnly, validate(resetPasswordSchema), resetSellerPassword);

module.exports = router;
