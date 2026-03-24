const express = require("express");

const {
  createSeller,
  listUsers,
  resetSellerPassword,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/", listUsers);
router.post("/create-seller", createSeller);
router.put("/:id/reset-password", resetSellerPassword);

module.exports = router;
