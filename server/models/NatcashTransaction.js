const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class NatcashTransaction extends Model {}

NatcashTransaction.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    phone_number: { type: DataTypes.STRING(20), allowNull: false },
    client_name: { type: DataTypes.STRING(200), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    service_type: { type: DataTypes.ENUM("depot", "retrait", "transfert"), allowNull: false },
    receipt_code: { type: DataTypes.STRING(25), allowNull: false, unique: true },
    processed_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  {
    sequelize,
    modelName: "NatcashTransaction",
    tableName: "natcash_transactions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = NatcashTransaction;
