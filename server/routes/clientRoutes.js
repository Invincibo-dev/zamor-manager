const express = require("express");

const {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} = require("../controllers/clientController");
const { protect } = require("../middleware/authMiddleware");
const { adminOrGestionnaire } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validate");
const { createClientSchema, updateClientSchema } = require("../validators/clientSchema");

const router = express.Router();

router.use(protect, adminOrGestionnaire);

router.get("/", listClients);
router.get("/:id", getClient);
router.post("/", validate(createClientSchema), createClient);
router.put("/:id", validate(updateClientSchema), updateClient);
router.delete("/:id", deleteClient);

module.exports = router;
