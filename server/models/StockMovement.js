const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class StockMovement extends Model {}

StockMovement.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("sale", "restock", "adjustment", "loss"),
      allowNull: false,
    },
    // Positif pour entrée, négatif pour sortie
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reference_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "StockMovement",
    tableName: "stock_movements",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = StockMovement;
