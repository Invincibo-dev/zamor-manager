const { DataTypes, Model } = require("sequelize");

const { sequelize } = require("../config/database");

class Repair extends Model {}

Repair.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    ticket: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    client_nom: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    client_telephone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    phone_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    phone_description: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    panne: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    cout_estimation: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    cout_final: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    statut: {
      type: DataTypes.ENUM("en_attente", "en_cours", "termine", "livre"),
      allowNull: false,
      defaultValue: "en_attente",
    },
    date_depot: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    date_livraison_estimee: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    date_livraison_reelle: {
      type: DataTypes.DATEONLY,
      allowNull: true,
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
    modelName: "Repair",
    tableName: "repairs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Repair;
