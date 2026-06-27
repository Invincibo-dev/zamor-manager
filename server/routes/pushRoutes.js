const express = require("express");

const { subscribe, unsubscribe, getVapidPublicKey } = require("../controllers/pushController");
const { protect } = require("../middleware/authMiddleware");
const { adminOrGestionnaire } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/vapid-public-key", protect, getVapidPublicKey);
router.post("/subscribe", protect, adminOrGestionnaire, subscribe);
router.post("/unsubscribe", protect, adminOrGestionnaire, unsubscribe);

module.exports = router;
