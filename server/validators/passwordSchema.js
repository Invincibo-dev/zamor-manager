const { z } = require("zod");

// Politique de mot de passe : min 10 caractères, 1 majuscule, 1 chiffre
// Utilisé par authSchema (création compte) et userSchema (reset mot de passe)
const passwordSchema = z.string().superRefine((val, ctx) => {
  if (val.length < 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le mot de passe doit contenir au moins 10 caractères.",
    });
  }
  if (!/[A-Z]/.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le mot de passe doit contenir au moins une majuscule.",
    });
  }
  if (!/[0-9]/.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le mot de passe doit contenir au moins un chiffre.",
    });
  }
});

module.exports = { passwordSchema };
