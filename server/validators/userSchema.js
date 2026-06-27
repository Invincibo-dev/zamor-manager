const { z } = require("zod");

const createSellerSchema = z.object({
  name: z.string().min(1, "Nom requis.").max(100),
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  role: z.enum(["vendeur", "gestionnaire"]).optional().default("vendeur"),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

module.exports = { createSellerSchema, resetPasswordSchema };
