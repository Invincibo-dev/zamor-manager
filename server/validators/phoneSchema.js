const { z } = require("zod");

const createPhoneSchema = z.object({
  imei: z
    .string()
    .min(1, "IMEI requis.")
    .max(20, "IMEI trop long.")
    .regex(/^[\d/\-]+$/, "IMEI invalide (chiffres, / ou - uniquement)."),
  modele: z.string().min(1, "Modèle requis.").max(200),
  couleur: z.string().max(100).optional(),
  prix_achat: z.coerce.number().min(0, "prix_achat doit être >= 0."),
  prix_vente: z.coerce.number().min(0, "prix_vente doit être >= 0."),
  notes: z.string().max(1000).optional(),
});

const updatePhoneSchema = z.object({
  modele: z.string().min(1).max(200).optional(),
  couleur: z.string().max(100).optional(),
  prix_achat: z.coerce.number().min(0).optional(),
  prix_vente: z.coerce.number().min(0).optional(),
  statut: z.enum(["disponible", "vendu", "en_reparation"]).optional(),
  notes: z.string().max(1000).optional(),
});

module.exports = { createPhoneSchema, updatePhoneSchema };
