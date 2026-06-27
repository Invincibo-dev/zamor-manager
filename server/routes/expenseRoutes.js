const express = require("express");

const {
  listExpenses,
  getSummary,
  createExpense,
  updateExpense,
  deleteExpense,
  exportExpensesCSV,
} = require("../controllers/expenseController");
const { protect } = require("../middleware/authMiddleware");
const { adminOrGestionnaire } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validate");
const {
  createExpenseSchema,
  updateExpenseSchema,
} = require("../validators/expenseSchema");

const router = express.Router();

router.use(protect, adminOrGestionnaire);

// static sub-routes must be defined before /:id to avoid route clash
router.get("/summary", getSummary);
router.get("/export", exportExpensesCSV);
router.get("/", listExpenses);
router.post("/", validate(createExpenseSchema), createExpense);
router.put("/:id", validate(updateExpenseSchema), updateExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
