const express = require("express");

const {
  createSeller,
  listUsers,
  resetSellerPassword,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/", protect, listUsers);
router.post("/create-seller", protect, adminOnly, createSeller);
router.put("/:id/reset-password", protect, adminOnly, resetSellerPassword);

module.exports = router;
