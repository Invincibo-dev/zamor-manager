const { DataTypes, Model } = require("sequelize");

const { sequelize } = require("../config/database");

class Debt extends Model {}

Debt.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    sale_receipt_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    montant_total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    montant_paye: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    statut: {
      type: DataTypes.ENUM("en_cours", "remboursee", "annulee"),
      allowNull: false,
      defaultValue: "en_cours",
    },
    notes: {
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
    modelName: "Debt",
    tableName: "debts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Debt;
