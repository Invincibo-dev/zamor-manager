const { UniqueConstraintError, Op } = require("sequelize");

const { sequelize, SaleReceipt, ReceiptItem, User, CompanySettings, Product, StockMovement, Phone } = require("../models");
const generateReceiptCode = require("../utils/generateReceiptCode");
const { generateReceiptPdf } = require("../utils/pdfGenerator");
const { sendLowStockAlerts } = require("./pushController");

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
      devise = "HTG",
      taux_change,
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
        stock_alert: false,
      });
    }

    const normalizedItems = items.map((item) => {
      const quantite = Number(item.quantite);
      const prixUnitaire = Number(item.prix_unitaire);

      return {
        nom_produit: item.nom_produit,
        product_id: item.product_id ? Number(item.product_id) : null,
        phone_id: item.phone_id ? Number(item.phone_id) : null,
        prix_achat: item.prix_achat != null ? Number(item.prix_achat) : null,
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
        devise: devise || "HTG",
        taux_change: taux_change != null ? Number(taux_change) : null,
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

    // --- Décrément stock transactionnel ---
    // Agréger les quantités par product_id (un produit peut apparaître sur plusieurs lignes)
    const productQtyMap = {};
    for (const item of normalizedItems) {
      if (!item.product_id) continue;
      productQtyMap[item.product_id] = (productQtyMap[item.product_id] || 0) + item.quantite;
    }

    let stock_alert = false;
    const stockMovements = [];

    for (const [productId, qty] of Object.entries(productQtyMap)) {
      const product = await Product.findByPk(Number(productId), {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!product) continue;

      if (product.quantite_stock < qty) {
        stock_alert = true;
      }

      await product.decrement("quantite_stock", { by: qty, transaction });

      stockMovements.push({
        product_id: Number(productId),
        type: "sale",
        quantity: -qty,
        reference_id: receipt.id,
        note: null,
        created_by: receipt.vendeur_id,
      });
    }

    if (stockMovements.length > 0) {
      await StockMovement.bulkCreate(stockMovements, { transaction });
    }
    // --- Fin décrément stock ---

    // --- Mise à jour statut téléphones ---
    const phoneIds = [...new Set(
      normalizedItems.filter((i) => i.phone_id).map((i) => i.phone_id)
    )];

    for (const phoneId of phoneIds) {
      const phone = await Phone.findByPk(phoneId, {
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!phone) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `Téléphone introuvable (ID: ${phoneId}).`,
        });
      }

      if (phone.statut !== "disponible") {
        await transaction.rollback();
        return res.status(409).json({
          success: false,
          message: `Le téléphone "${phone.imei}" (${phone.modele}) n'est plus disponible à la vente.`,
        });
      }

      await phone.update({ statut: "vendu", sale_receipt_id: receipt.id }, { transaction });
    }
    // --- Fin mise à jour téléphones ---

    await transaction.commit();

    const createdReceipt = await SaleReceipt.findByPk(receipt.id, {
      include: receiptInclude,
    });

    // Fire-and-forget: push notifications si produits sous seuil (ne bloque pas la réponse)
    if (Object.keys(productQtyMap).length > 0) {
      setImmediate(async () => {
        try {
          const alertes = await Product.findAll({
            where: { id: Object.keys(productQtyMap).map(Number) },
            attributes: ["id", "nom", "quantite_stock", "seuil_alerte"],
            raw: true,
          });
          const below = alertes.filter((p) => p.quantite_stock <= p.seuil_alerte);
          if (below.length > 0) await sendLowStockAlerts(below);
        } catch { /* non-critique */ }
      });
    }

    return res.status(201).json({
      success: true,
      receipt: createdReceipt,
      code_recu: createdReceipt.code_recu,
      reused: false,
      stock_alert,
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
            stock_alert: false,
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
    const {
      startDate,
      endDate,
      vendeurId,
      modePaiement,
      minMontant,
      maxMontant,
      search,
      page,
      limit,
    } = req.query;

    const where = {};

    if (req.user.role !== "admin") {
      where.vendeur_id = req.user.id;
    } else if (vendeurId) {
      where.vendeur_id = Number(vendeurId);
    }

    if (startDate && endDate) {
      where.date = {
        [Op.between]: [
          `${startDate} 00:00:00`,
          `${endDate} 23:59:59`,
        ],
      };
    }

    if (modePaiement) {
      where.mode_paiement = modePaiement;
    }

    if (minMontant || maxMontant) {
      where.total_general = {};
      if (minMontant) where.total_general[Op.gte] = Number(minMontant);
      if (maxMontant) where.total_general[Op.lte] = Number(maxMontant);
    }

    if (search) {
      where.code_recu = { [Op.like]: `%${search}%` };
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const offset = (pageNum - 1) * pageSize;

    const { count, rows } = await SaleReceipt.findAndCountAll({
      where,
      include: receiptInclude,
      order: [["date", "DESC"], ["id", "DESC"]],
      limit: pageSize,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      sales: rows,
      total: count,
      page: pageNum,
      totalPages: Math.ceil(count / pageSize),
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

    const [company] = await CompanySettings.findOrCreate({
      where: { id: 1 },
      defaults: { name: "Zamor Multi Services Acces" },
    });

    const pdfBuffer = await generateReceiptPdf(receipt, company);

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
