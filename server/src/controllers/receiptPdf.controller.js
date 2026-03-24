const { saleReceiptModel } = require("../models");
const { generateReceiptPdf } = require("../services/receiptPdf.service");

const getReceiptPdf = async (req, res, next) => {
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
  getReceiptPdf,
};
