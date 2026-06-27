const { z } = require("zod");

const rechargeSchema = z.object({
  company: z.enum(["natcom", "digicel"], {
    errorMap: () => ({ message: "Compagnie invalide. Valeurs acceptées : natcom, digicel." }),
  }),
  phone_number: z
    .string()
    .min(8, "Numéro de téléphone trop court (min 8 caractères).")
    .max(20, "Numéro de téléphone trop long (max 20 caractères).")
    .regex(/^\+?[\d\s\-()+]+$/, "Format de numéro invalide.")
    .transform((s) => s.trim()),
  amount: z.coerce
    .number()
    .positive("Le montant doit être positif.")
    .max(500_000, "Montant trop élevé (max 500 000 HTG)."),
});

module.exports = { rechargeSchema };
