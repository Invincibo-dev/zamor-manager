const express = require("express");

const {
  listPhones,
  getPhone,
  createPhone,
  updatePhone,
  deletePhone,
} = require("../controllers/phoneController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly, adminOrGestionnaire } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validate");
const { createPhoneSchema, updatePhoneSchema } = require("../validators/phoneSchema");

const router = express.Router();

router.use(protect, adminOrGestionnaire);

router.get("/", listPhones);
router.get("/:id", getPhone);
router.post("/", validate(createPhoneSchema), createPhone);
router.put("/:id", validate(updatePhoneSchema), updatePhone);
router.delete("/:id", adminOnly, deletePhone);

module.exports = router;
