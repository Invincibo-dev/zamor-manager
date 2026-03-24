const { pool } = require("../config/db");

const TABLE_NAME = "users";

const createTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'vendeur') NOT NULL DEFAULT 'vendeur',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  await pool.execute(query);
};

const findById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, created_at, updated_at FROM ${TABLE_NAME} WHERE id = ? LIMIT 1`,
    [id]
  );

  return rows[0] || null;
};

const findByEmail = async (email) => {
  const [rows] = await pool.execute(
    `SELECT id, name, email, password, role, created_at, updated_at FROM ${TABLE_NAME} WHERE email = ? LIMIT 1`,
    [email]
  );

  return rows[0] || null;
};

const create = async ({ name, email, password, role }) => {
  const [result] = await pool.execute(
    `INSERT INTO ${TABLE_NAME} (name, email, password, role) VALUES (?, ?, ?, ?)`,
    [name, email, password, role]
  );

  return findById(result.insertId);
};

module.exports = {
  TABLE_NAME,
  createTable,
  findById,
  findByEmail,
  create,
};
