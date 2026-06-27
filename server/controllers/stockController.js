const { sequelize, Product, StockMovement } = require("../models");

const restock = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { product_id, quantity, note } = req.body;
    const qty = Number(quantity);

    if (!product_id || !qty || qty <= 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "product_id et quantity (entier > 0) sont requis.",
      });
    }

    const product = await Product.findByPk(Number(product_id), {
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Produit introuvable.",
      });
    }

    await product.increment("quantite_stock", { by: qty, transaction });

    const movement = await StockMovement.create(
      {
        product_id: Number(product_id),
        type: "restock",
        quantity: qty,
        reference_id: null,
        note: note || null,
        created_by: req.user.id,
      },
      { transaction }
    );

    await transaction.commit();

    await product.reload();

    return res.status(200).json({
      success: true,
      product,
      movement,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = { restock };
