const { sequelize } = require("../config/database");
const User = require("./User");
const SaleReceipt = require("./SaleReceipt");
const ReceiptItem = require("./ReceiptItem");
const CompanySettings = require("./CompanySettings");
const Product = require("./Product");
const StockMovement = require("./StockMovement");
const Phone = require("./Phone");
const Repair = require("./Repair");
const Client = require("./Client");
const Debt = require("./Debt");
const DebtPayment = require("./DebtPayment");
const Expense = require("./Expense");
const LoginHistory = require("./LoginHistory");
const NatcashTransaction = require("./NatcashTransaction");
const Recharge = require("./Recharge");

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

ReceiptItem.belongsTo(Product, {
  foreignKey: "product_id",
  as: "product",
});

Product.hasMany(ReceiptItem, {
  foreignKey: "product_id",
  as: "saleItems",
});

Product.hasMany(StockMovement, {
  foreignKey: "product_id",
  as: "movements",
});

StockMovement.belongsTo(Product, {
  foreignKey: "product_id",
  as: "product",
});

StockMovement.belongsTo(User, {
  foreignKey: "created_by",
  as: "creator",
});

Phone.belongsTo(SaleReceipt, {
  foreignKey: "sale_receipt_id",
  as: "receipt",
});

SaleReceipt.hasMany(Phone, {
  foreignKey: "sale_receipt_id",
  as: "phones",
});

ReceiptItem.belongsTo(Phone, {
  foreignKey: "phone_id",
  as: "phone",
});

Phone.hasMany(ReceiptItem, {
  foreignKey: "phone_id",
  as: "saleItems",
});

Repair.belongsTo(Phone, { foreignKey: "phone_id", as: "phone" });
Phone.hasMany(Repair, { foreignKey: "phone_id", as: "repairs" });

Repair.belongsTo(User, { foreignKey: "created_by", as: "creator" });
User.hasMany(Repair, { foreignKey: "created_by", as: "repairs" });

Client.hasMany(Debt, { foreignKey: "client_id", as: "debts" });
Debt.belongsTo(Client, { foreignKey: "client_id", as: "client" });

Debt.belongsTo(SaleReceipt, { foreignKey: "sale_receipt_id", as: "receipt" });
SaleReceipt.hasMany(Debt, { foreignKey: "sale_receipt_id", as: "debts" });

Debt.hasMany(DebtPayment, { foreignKey: "debt_id", as: "payments", onDelete: "CASCADE" });
DebtPayment.belongsTo(Debt, { foreignKey: "debt_id", as: "debt" });

Debt.belongsTo(User, { foreignKey: "created_by", as: "creator" });
DebtPayment.belongsTo(User, { foreignKey: "created_by", as: "creator" });

LoginHistory.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(LoginHistory, { foreignKey: "user_id", as: "loginHistory" });

NatcashTransaction.belongsTo(User, { foreignKey: "processed_by", as: "agent" });
User.hasMany(NatcashTransaction, { foreignKey: "processed_by", as: "natcashTransactions" });

Recharge.belongsTo(User, { foreignKey: "processed_by", as: "agent" });
User.hasMany(Recharge, { foreignKey: "processed_by", as: "recharges" });

module.exports = {
  sequelize,
  User,
  SaleReceipt,
  ReceiptItem,
  CompanySettings,
  Product,
  StockMovement,
  Phone,
  Repair,
  Client,
  Debt,
  DebtPayment,
  Expense,
  LoginHistory,
  NatcashTransaction,
  Recharge,
};
