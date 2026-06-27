const { DataTypes, Model } = require("sequelize");

const { sequelize } = require("../config/database");

class Phone extends Model {}

Phone.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    imei: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    modele: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    couleur: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    prix_achat: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    prix_vente: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    statut: {
      type: DataTypes.ENUM("disponible", "vendu", "en_reparation"),
      allowNull: false,
      defaultValue: "disponible",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sale_receipt_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Phone",
    tableName: "phones",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Phone;
