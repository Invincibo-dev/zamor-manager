const express = require("express");

const {
  getCompanySettings,
  updateCompanySettings,
} = require("../controllers/companySettingsController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");
const { upload, checkMagicBytes } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", protect, getCompanySettings);
router.put("/", protect, adminOnly, upload.single("logo"), checkMagicBytes, updateCompanySettings);

module.exports = router;
