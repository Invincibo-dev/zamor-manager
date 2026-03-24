const { DataTypes, Model } = require("sequelize");

const { sequelize } = require("../config/database");

class SaleReceipt extends Model {}

SaleReceipt.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    code_recu: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    session_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    vendeur_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    total_general: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    mode_paiement: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    signature_vendeur: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "SaleReceipt",
    tableName: "sale_receipts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        name: "sale_receipts_date_idx",
        fields: ["date"],
      },
    ],
  }
);

module.exports = SaleReceipt;
