const { DataTypes, Model } = require("sequelize");

const { sequelize } = require("../config/database");

class ReceiptSequence extends Model {}

ReceiptSequence.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    year: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
    },
    current_value: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "ReceiptSequence",
    tableName: "receipt_sequences",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = ReceiptSequence;
