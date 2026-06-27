const { z } = require("zod");

const createExpenseSchema = z.object({
  categorie: z.string().min(1, "La catégorie est requise.").max(100),
  montant: z.coerce.number().min(0.01, "Le montant doit être supérieur à 0."),
  date_depense: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (AAAA-MM-JJ)."),
  note: z.string().max(2000).optional(),
});

const updateExpenseSchema = createExpenseSchema.partial();

module.exports = { createExpenseSchema, updateExpenseSchema };
