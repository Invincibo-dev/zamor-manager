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
