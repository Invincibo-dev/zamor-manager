const { DataTypes, Model } = require("sequelize");

const { sequelize } = require("../config/database");

class DebtPayment extends Model {}

DebtPayment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    debt_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    montant: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    mode_paiement: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Cash",
    },
    date_paiement: {
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
    modelName: "DebtPayment",
    tableName: "debt_payments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = DebtPayment;
