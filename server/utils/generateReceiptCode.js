const { Op, fn, col, where } = require("sequelize");

const { SaleReceipt } = require("../models");

const generateReceiptCode = async (transaction, receiptDate = new Date()) => {
  const year = new Date(receiptDate).getFullYear();

  const lastReceipt = await SaleReceipt.findOne({
    where: where(fn("YEAR", col("date")), year),
    order: [["id", "DESC"]],
    attributes: ["code_recu"],
    transaction,
  });

  const lastSequence = lastReceipt?.code_recu
    ? Number(lastReceipt.code_recu.split("-")[2])
    : 0;

  return `ZMR-${year}-${String(lastSequence + 1).padStart(5, "0")}`;
};

module.exports = generateReceiptCode;
