const { DataTypes, Model } = require("sequelize");

const { sequelize } = require("../config/database");

class ReceiptItem extends Model {}

ReceiptItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    receipt_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    phone_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    nom_produit: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    quantite: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    prix_unitaire: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    prix_achat: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "ReceiptItem",
    tableName: "receipt_items",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = ReceiptItem;
