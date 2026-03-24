const express = require("express");

const { listUsers } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/", listUsers);

module.exports = router;
