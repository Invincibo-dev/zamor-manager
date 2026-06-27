const { z } = require("zod");

const restockSchema = z.object({
  product_id: z.coerce
    .number()
    .int("product_id doit être un entier.")
    .positive("product_id doit être un entier positif."),
  quantity: z.coerce
    .number()
    .int("quantity doit être un entier.")
    .min(1, "quantity doit être >= 1."),
  note: z.string().max(500).optional(),
});

module.exports = { restockSchema };
