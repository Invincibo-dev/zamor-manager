const { z } = require("zod");

const loginSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(1, "Mot de passe requis."),
});

const createSellerSchema = z.object({
  name: z.string().min(1, "Nom requis.").max(100),
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  role: z.enum(["vendeur"]).optional(),
});

module.exports = { loginSchema, createSellerSchema };
