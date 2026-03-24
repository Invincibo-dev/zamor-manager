const { sequelize } = require("../config/database");
const User = require("./User");
const SaleReceipt = require("./SaleReceipt");
const ReceiptItem = require("./ReceiptItem");
const ReceiptSequence = require("./ReceiptSequence");

User.hasMany(SaleReceipt, {
  foreignKey: "vendeur_id",
  as: "receipts",
});

SaleReceipt.belongsTo(User, {
  foreignKey: "vendeur_id",
  as: "vendeur",
});

SaleReceipt.hasMany(ReceiptItem, {
  foreignKey: "receipt_id",
  as: "items",
  onDelete: "CASCADE",
});

ReceiptItem.belongsTo(SaleReceipt, {
  foreignKey: "receipt_id",
  as: "receipt",
});

module.exports = {
  sequelize,
  User,
  SaleReceipt,
  ReceiptItem,
  ReceiptSequence,
};
