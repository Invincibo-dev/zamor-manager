const express = require("express");

const {
  downloadBackup,
  getBackupList,
  downloadSavedBackup,
} = require("../controllers/backupController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/database", downloadBackup);
router.get("/list", getBackupList);
router.get("/files/:filename", downloadSavedBackup);

module.exports = router;
