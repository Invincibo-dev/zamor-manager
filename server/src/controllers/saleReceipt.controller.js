const { saleReceiptModel } = require("../models");
const { createSaleReceipt } = require("../services/saleReceipt.service");

const isValidProduct = (produit) => {
  return (
    produit &&
    produit.nom_produit &&
    Number.isFinite(Number(produit.quantite)) &&
    Number(produit.quantite) > 0 &&
    Number.isFinite(Number(produit.prix_unitaire)) &&
    Number(produit.prix_unitaire) >= 0 &&
    Number.isFinite(Number(produit.total)) &&
    Number(produit.total) >= 0
  );
};

const createReceipt = async (req, res, next) => {
  try {
    const {
      vendeur_id,
      date,
      produits,
      total_general,
      mode_paiement,
      signature_vendeur,
    } = req.body;

    if (!date || !Array.isArray(produits) || produits.length === 0 || !mode_paiement) {
      return res.status(400).json({
        success: false,
        message: "date, produits and mode_paiement are required.",
      });
    }

    if (vendeur_id && Number(vendeur_id) !== Number(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "The authenticated seller must match the sale receipt seller.",
      });
    }

    if (req.user.role !== "vendeur" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only authenticated sellers or admins can create receipts.",
      });
    }

    const invalidProduct = produits.find((produit) => !isValidProduct(produit));

    if (invalidProduct) {
      return res.status(400).json({
        success: false,
        message: "Each product must include nom_produit, quantite, prix_unitaire and total.",
      });
    }

    const computedTotal = produits.reduce((sum, produit) => sum + Number(produit.total), 0);
    const finalTotal = total_general ? Number(total_general) : computedTotal;

    const createdReceipt = await createSaleReceipt({
      vendeurId: req.user.id,
      date,
      produits: produits.map((produit) => ({
        nom_produit: produit.nom_produit,
        quantite: Number(produit.quantite),
        prix_unitaire: Number(produit.prix_unitaire),
        total: Number(produit.total),
      })),
      totalGeneral: finalTotal,
      modePaiement: mode_paiement,
      signatureVendeur: signature_vendeur,
    });

    const receipt = await saleReceiptModel.findById(createdReceipt.id);

    return res.status(201).json({
      success: true,
      message: "Sale receipt created successfully.",
      receipt,
    });
  } catch (error) {
    next(error);
  }
};

const getReceiptByCode = async (req, res, next) => {
  try {
    const receipt = await saleReceiptModel.findByCode(req.params.code);

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Sale receipt not found.",
      });
    }

    if (req.user.role !== "admin" && Number(receipt.vendeur_id) !== Number(req.user.id)) {
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
    const requestedSellerId = Number(req.params.vendeurId);

    if (req.user.role !== "admin" && requestedSellerId !== Number(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You can only access your own sales.",
      });
    }

    const sales = await saleReceiptModel.findBySeller(requestedSellerId);

    return res.status(200).json({
      success: true,
      sales,
    });
  } catch (error) {
    next(error);
  }
};

const getSalesByDate = async (req, res, next) => {
  try {
    const { startDate, endDate, vendeurId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required.",
      });
    }

    let targetSellerId = vendeurId ? Number(vendeurId) : null;

    if (req.user.role !== "admin") {
      targetSellerId = Number(req.user.id);
    }

    const sales = await saleReceiptModel.findByDateRange({
      startDate,
      endDate,
      vendeurId: targetSellerId,
    });

    return res.status(200).json({
      success: true,
      sales,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReceipt,
  getReceiptByCode,
  getSalesBySeller,
  getSalesByDate,
};
