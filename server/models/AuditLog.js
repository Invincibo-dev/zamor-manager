const { DataTypes, Model } = require("sequelize");
const { sequelize } = require("../config/database");

class AuditLog extends Model {}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    table_name: { type: DataTypes.STRING(50), allowNull: false },
    record_id: { type: DataTypes.INTEGER, allowNull: false },
    action: { type: DataTypes.ENUM("create", "update", "delete"), allowNull: false },
    changed_by: { type: DataTypes.INTEGER, allowNull: true },
    old_values: { type: DataTypes.JSON, allowNull: true },
    new_values: { type: DataTypes.JSON, allowNull: true },
    ip_address: { type: DataTypes.STRING(45), allowNull: true },
  },
  {
    sequelize,
    modelName: "AuditLog",
    tableName: "audit_log",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

module.exports = AuditLog;
