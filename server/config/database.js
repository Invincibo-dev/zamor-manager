const mysql = require("mysql2/promise");
const { Sequelize } = require("sequelize");

const databaseConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "zamor_manager",
};

const mysqlPool = mysql.createPool({
  ...databaseConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const sequelize = new Sequelize(
  databaseConfig.database,
  databaseConfig.user,
  databaseConfig.password,
  {
    host: databaseConfig.host,
    port: databaseConfig.port,
    dialect: "mysql",
    logging: false,
    timezone: "+00:00",
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const verifyDatabaseConnection = async () => {
  try {
    const connection = await mysqlPool.getConnection();
    await connection.ping();
    connection.release();
  } catch (error) {
    console.error("MySQL pool connection failed:", error.message);
    throw error;
  }
};

module.exports = {
  databaseConfig,
  mysqlPool,
  sequelize,
  verifyDatabaseConnection,
};
