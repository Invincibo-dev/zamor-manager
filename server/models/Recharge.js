const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");
const { logAudit } = require("../utils/auditLogger");

class Recharge extends Model {}

Recharge.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    company: { type: DataTypes.ENUM("natcom", "digicel"), allowNull: false },
    phone_number: { type: DataTypes.STRING(20), allowNull: false },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    receipt_code: { type: DataTypes.STRING(25), allowNull: false, unique: true },
    processed_by: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  },
  {
    sequelize,
    modelName: "Recharge",
    tableName: "recharges",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

Recharge.addHook("afterCreate", async (instance, options) => {
  const ctx = options.auditCtx || {};
  await logAudit({
    tableName: "recharges",
    recordId: instance.id,
    action: "create",
    changedBy: ctx.userId ?? instance.processed_by,
    oldValues: null,
    newValues: instance.toJSON(),
    ip: ctx.ip ?? null,
  });
});

module.exports = Recharge;
