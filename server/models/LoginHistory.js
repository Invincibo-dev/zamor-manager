const { DataTypes, Model } = require("sequelize");

const { sequelize } = require("../config/database");

class LoginHistory extends Model {}

LoginHistory.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    email: { type: DataTypes.STRING(200), allowNull: false },
    ip: { type: DataTypes.STRING(45), allowNull: false },
    user_agent: { type: DataTypes.STRING(500), allowNull: true },
    success: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  {
    sequelize,
    modelName: "LoginHistory",
    tableName: "login_history",
    updatedAt: false,
    createdAt: "created_at",
  }
);

module.exports = LoginHistory;
