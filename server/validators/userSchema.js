const { z } = require("zod");
const { passwordSchema } = require("./passwordSchema");

const createSellerSchema = z.object({
  name: z.string().min(1, "Nom requis.").max(100),
  email: z.string().email("Adresse email invalide."),
  password: passwordSchema,
  role: z.enum(["vendeur", "gestionnaire"]).optional().default("vendeur"),
});

// Le champ s'appelle newPassword pour correspondre au body attendu par resetSellerPassword
const resetPasswordSchema = z.object({
  newPassword: passwordSchema,
});

module.exports = { createSellerSchema, resetPasswordSchema };
