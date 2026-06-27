const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class Product extends Model {}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    nom: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    quantite_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    seuil_alerte: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
    },
    prix_achat: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Product",
    tableName: "products",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Product;
