const express = require("express");

const {
  listRepairs,
  getRepair,
  createRepair,
  updateRepair,
  deleteRepair,
} = require("../controllers/repairController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly, adminOrGestionnaire } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validate");
const { createRepairSchema, updateRepairSchema } = require("../validators/repairSchema");

const router = express.Router();

router.use(protect, adminOrGestionnaire);

router.get("/", listRepairs);
router.get("/:id", getRepair);
router.post("/", validate(createRepairSchema), createRepair);
router.put("/:id", validate(updateRepairSchema), updateRepair);
router.delete("/:id", adminOnly, deleteRepair);

module.exports = router;
