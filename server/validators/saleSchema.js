const { z } = require("zod");

const saleItemSchema = z.object({
  nom_produit: z.string().min(1, "nom_produit requis.").max(255),
  quantite: z.coerce.number().int("quantite doit être un entier.").min(1, "quantite doit être >= 1."),
  prix_unitaire: z.coerce.number().min(0, "prix_unitaire doit être >= 0."),
  product_id: z.coerce.number().int().positive().nullable().optional(),
  phone_id: z.coerce.number().int().positive().nullable().optional(),
  prix_achat: z.coerce.number().min(0).nullable().optional(),
});

const createSaleSchema = z.object({
  session_id: z.string().min(1, "session_id requis."),
  date: z.string().min(1, "date requise."),
  mode_paiement: z.string().min(1, "mode_paiement requis."),
  vendeur_id: z.coerce.number().int().positive().optional(),
  signature_vendeur: z.string().optional(),
  devise: z.enum(["HTG", "USD"]).optional().default("HTG"),
  taux_change: z.coerce.number().positive().nullable().optional(),
  items: z
    .array(saleItemSchema)
    .min(1, "La vente doit contenir au moins un article."),
});

module.exports = { createSaleSchema };
