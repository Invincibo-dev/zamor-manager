const { z } = require("zod");

const createClientSchema = z.object({
  nom: z.string().min(1, "Le nom est requis.").max(200),
  telephone: z.string().max(50).optional(),
  email: z
    .union([z.string().email("Email invalide."), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? null : v)),
  notes: z.string().max(2000).optional(),
});

const updateClientSchema = createClientSchema.partial();

module.exports = { createClientSchema, updateClientSchema };
