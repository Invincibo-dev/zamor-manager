const { z } = require("zod");

const createDebtSchema = z.object({
  client_id: z.coerce.number().int().positive("Client requis."),
  sale_receipt_id: z.coerce.number().int().positive().nullable().optional(),
  montant_total: z.coerce.number().min(0.01, "Le montant doit être supérieur à 0."),
  notes: z.string().max(2000).optional(),
});

const addPaymentSchema = z.object({
  montant: z.coerce.number().min(0.01, "Le montant doit être supérieur à 0."),
  mode_paiement: z.string().min(1).max(50).optional().default("Cash"),
  date_paiement: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide (AAAA-MM-JJ)."),
  note: z.string().max(1000).optional(),
});

const updateDebtSchema = z.object({
  statut: z.enum(["en_cours", "remboursee", "annulee"]).optional(),
  notes: z.string().max(2000).optional(),
});

module.exports = { createDebtSchema, addPaymentSchema, updateDebtSchema };
