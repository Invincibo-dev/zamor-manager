const { z } = require("zod");

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateField = z.string().regex(dateRegex, "Format de date invalide (YYYY-MM-DD).").nullable().optional();

const createRepairSchema = z.object({
  client_nom: z.string().min(1, "Nom du client requis.").max(200),
  client_telephone: z.string().max(50).optional(),
  phone_id: z.coerce.number().int().positive().nullable().optional(),
  phone_description: z.string().max(200).optional(),
  panne: z.string().min(1, "Description de la panne requise."),
  cout_estimation: z.coerce.number().min(0).nullable().optional(),
  date_depot: z
    .string()
    .regex(dateRegex, "date_depot doit être au format YYYY-MM-DD."),
  date_livraison_estimee: dateField,
  notes: z.string().max(2000).optional(),
});

const updateRepairSchema = z.object({
  client_nom: z.string().min(1).max(200).optional(),
  client_telephone: z.string().max(50).optional(),
  panne: z.string().min(1).optional(),
  cout_estimation: z.coerce.number().min(0).nullable().optional(),
  cout_final: z.coerce.number().min(0).nullable().optional(),
  statut: z.enum(["en_attente", "en_cours", "termine", "livre"]).optional(),
  date_livraison_estimee: dateField,
  date_livraison_reelle: dateField,
  notes: z.string().max(2000).optional(),
});

module.exports = { createRepairSchema, updateRepairSchema };
