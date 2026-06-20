const { DataTypes, Model } = require("sequelize");

const { sequelize } = require("../config/database");

class CompanySettings extends Model {}

CompanySettings.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: "Zamor Multi Services Acces",
    },
    // Stocké en base64 data URL (ex: data:image/png;base64,...)
    // Évite la dépendance au filesystem (Render free tier = stockage éphémère)
    logo_data: {
      type: DataTypes.TEXT("medium"),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "CompanySettings",
    tableName: "company_settings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = CompanySettings;
