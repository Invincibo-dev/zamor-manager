const { DataTypes, Model } = require("sequelize");

const { sequelize } = require("../config/database");
const { logAudit } = require("../utils/auditLogger");

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

// Capture les valeurs avant modification pour les enregistrer dans le journal d'audit
Debt.addHook("beforeUpdate", (instance, options) => {
  options._prevData = instance.previous();
});

Debt.addHook("afterUpdate", async (instance, options) => {
  const ctx = options.auditCtx || {};
  await logAudit({
    tableName: "debts",
    recordId: instance.id,
    action: "update",
    changedBy: ctx.userId ?? null,
    oldValues: options._prevData ?? {},
    newValues: instance.toJSON(),
    ip: ctx.ip ?? null,
  });
});

Debt.addHook("afterDestroy", async (instance, options) => {
  const ctx = options.auditCtx || {};
  await logAudit({
    tableName: "debts",
    recordId: instance.id,
    action: "delete",
    changedBy: ctx.userId ?? null,
    oldValues: instance.toJSON(),
    newValues: null,
    ip: ctx.ip ?? null,
  });
});

module.exports = Debt;
