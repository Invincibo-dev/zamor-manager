const userModel = require("./user.model");
const saleReceiptModel = require("./saleReceipt.model");

const initializeModels = async () => {
  await userModel.createTable();
  await saleReceiptModel.createReceiptsTable();
  await saleReceiptModel.createReceiptItemsTable();
};

module.exports = {
  initializeModels,
  userModel,
  saleReceiptModel,
};
