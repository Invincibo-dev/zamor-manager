const { z } = require("zod");

const natcashSchema = z.object({
  phone_number: z
    .string()
    .min(8, "Numéro de téléphone trop court (min 8 caractères).")
    .max(20, "Numéro de téléphone trop long (max 20 caractères).")
    .regex(/^\+?[\d\s\-()+]+$/, "Format de numéro invalide.")
    .transform((s) => s.trim()),
  client_name: z
    .string()
    .min(2, "Nom du client trop court (min 2 caractères).")
    .max(100, "Nom du client trop long (max 100 caractères).")
    .transform((s) => s.trim()),
  amount: z.coerce
    .number()
    .positive("Le montant doit être positif.")
    .max(1_000_000, "Montant trop élevé (max 1 000 000 HTG)."),
  service_type: z.enum(["depot", "retrait", "transfert"], {
    errorMap: () => ({ message: "Type invalide. Valeurs acceptées : depot, retrait, transfert." }),
  }),
});

module.exports = { natcashSchema };
