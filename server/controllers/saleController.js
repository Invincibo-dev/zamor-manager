const { UniqueConstraintError } = require("sequelize");

const { sequelize, SaleReceipt, ReceiptItem, User } = require("../models");
const generateReceiptCode = require("../utils/generateReceiptCode");
const { generateReceiptPdf } = require("../utils/pdfGenerator");

const receiptInclude = [
  {
    model: User,
    as: "vendeur",
    attributes: ["id", "name", "email", "role"],
  },
  {
    model: ReceiptItem,
    as: "items",
    attributes: ["id", "nom_produit", "quantite", "prix_unitaire", "total"],
  },
];

const canAccessReceipt = (user, receipt) => {
  return user.role === "admin" || Number(receipt.vendeur_id) === Number(user.id);
};

const createSale = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      session_id,
      vendeur_id,
      date,
      mode_paiement,
      signature_vendeur,
      items = [],
    } = req.body;

    if (
      !session_id ||
      !date ||
      !mode_paiement ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "session_id, date, mode_paiement and items are required.",
      });
    }

    const invalidItem = items.find(
      (item) =>
        !item.nom_produit ||
        Number(item.quantite) <= 0 ||
        Number(item.prix_unitaire) < 0
    );

    if (invalidItem) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Each item must include nom_produit, quantite and prix_unitaire.",
      });
    }

    const vendeurId =
      req.user.role === "admin" && vendeur_id ? Number(vendeur_id) : Number(req.user.id);

    if (req.user.role === "vendeur" && vendeurId !== Number(req.user.id)) {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: "The authenticated seller must match the sale receipt seller.",
      });
    }

    const existingReceipt = await SaleReceipt.findOne({
      where: { session_id },
      include: receiptInclude,
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (existingReceipt) {
      await transaction.commit();

      return res.status(200).json({
        success: true,
        receipt: existingReceipt,
        code_recu: existingReceipt.code_recu,
        reused: true,
      });
    }

    const normalizedItems = items.map((item) => {
      const quantite = Number(item.quantite);
      const prixUnitaire = Number(item.prix_unitaire);

      return {
        nom_produit: item.nom_produit,
        quantite,
        prix_unitaire: prixUnitaire,
        total: quantite * prixUnitaire,
      };
    });

    const totalGeneral = normalizedItems.reduce((sum, item) => sum + item.total, 0);
    const codeRecu = await generateReceiptCode(transaction, date);

    const receipt = await SaleReceipt.create(
      {
        code_recu: codeRecu,
        session_id,
        vendeur_id: vendeurId,
        date,
        total_general: totalGeneral,
        mode_paiement,
        signature_vendeur,
      },
      { transaction }
    );

    await ReceiptItem.bulkCreate(
      normalizedItems.map((item) => ({
        ...item,
        receipt_id: receipt.id,
      })),
      { transaction }
    );

    await transaction.commit();

    const createdReceipt = await SaleReceipt.findByPk(receipt.id, {
      include: receiptInclude,
    });

    return res.status(201).json({
      success: true,
      receipt: createdReceipt,
      code_recu: createdReceipt.code_recu,
      reused: false,
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      await transaction.rollback();

      try {
        const receipt = await SaleReceipt.findOne({
          where: { session_id: req.body.session_id },
          include: receiptInclude,
        });

        if (receipt) {
          return res.status(200).json({
            success: true,
            receipt,
            code_recu: receipt.code_recu,
            reused: true,
          });
        }
      } catch (lookupError) {
        return next(lookupError);
      }
    }

    await transaction.rollback();
    next(error);
  }
};

const getSales = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};

    if (req.user.role !== "admin") {
      where.vendeur_id = req.user.id;
    }

    if (startDate && endDate) {
      where.date = {
        [require("sequelize").Op.between]: [
          `${startDate} 00:00:00`,
          `${endDate} 23:59:59`,
        ],
      };
    }

    const sales = await SaleReceipt.findAll({
      where,
      include: receiptInclude,
      order: [["date", "DESC"], ["id", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      sales,
    });
  } catch (error) {
    next(error);
  }
};

const getSaleByCode = async (req, res, next) => {
  try {
    const receipt = await SaleReceipt.findOne({
      where: { code_recu: req.params.code },
      include: receiptInclude,
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Sale receipt not found.",
      });
    }

    if (!canAccessReceipt(req.user, receipt)) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own sale receipts.",
      });
    }

    return res.status(200).json({
      success: true,
      receipt,
    });
  } catch (error) {
    next(error);
  }
};

const getSalesBySeller = async (req, res, next) => {
  try {
    const requestedSellerId = Number(req.params.sellerId);

    if (req.user.role !== "admin" && requestedSellerId !== Number(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own sales.",
      });
    }

    const sales = await SaleReceipt.findAll({
      where: { vendeur_id: requestedSellerId },
      include: receiptInclude,
      order: [["date", "DESC"], ["id", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      sales,
    });
  } catch (error) {
    next(error);
  }
};

const getSalePdf = async (req, res, next) => {
  try {
    const receipt = await SaleReceipt.findOne({
      where: { code_recu: req.params.code },
      include: receiptInclude,
    });

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Sale receipt not found.",
      });
    }

    if (!canAccessReceipt(req.user, receipt)) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own sale receipts.",
      });
    }

    const pdfBuffer = await generateReceiptPdf(receipt);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${receipt.code_recu}.pdf"`
    );

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleByCode,
  getSalesBySeller,
  getSalePdf,
};
