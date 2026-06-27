const { DataTypes, Model } = require("sequelize");

const { sequelize } = require("../config/database");

class Expense extends Model {}

Expense.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    categorie: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    montant: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    date_depense: {
      type: DataTypes.DATEONLY,
      allowNull: false,
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
    modelName: "Expense",
    tableName: "expenses",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Expense;
