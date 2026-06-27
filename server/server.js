require("dotenv").config();

// Sentry doit être initialisé avant tous les autres requires
if (process.env.SENTRY_DSN) {
  const Sentry = require("@sentry/node");
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const fs = require("fs");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const { DataTypes } = require("sequelize");

const { verifyDatabaseConnection } = require("./config/database");
const { sequelize } = require("./models");
const authRoutes = require("./routes/authRoutes");
const saleRoutes = require("./routes/saleRoutes");
const reportRoutes = require("./routes/reportRoutes");
const userRoutes = require("./routes/userRoutes");
const companySettingsRoutes = require("./routes/companySettingsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const stockRoutes = require("./routes/stockRoutes");
const phoneRoutes = require("./routes/phoneRoutes");
const repairRoutes = require("./routes/repairRoutes");
const clientRoutes = require("./routes/clientRoutes");
const debtRoutes = require("./routes/debtRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const loginHistoryRoutes = require("./routes/loginHistoryRoutes");
const backupRoutes = require("./routes/backupRoutes");
const pushRoutes = require("./routes/pushRoutes");
const natcashRoutes = require("./routes/natcashRoutes");
const rechargeRoutes = require("./routes/rechargeRoutes");
const { scheduleBackup } = require("./utils/scheduler");
const { warmBrowser } = require("./utils/pdfGenerator");
const { logger } = require("./middleware/logger");
const appLogger = require("./utils/logger");
const { getReceiptLogoMimeType, getReceiptLogoPath } = require("./utils/receiptLogo");

const app = express();
const PORT = process.env.PORT || 5000;
const buildPath = path.resolve(__dirname, "build");
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const databaseSchemaMutationsEnabled =
  process.env.DB_SYNC_ENABLED !== undefined
    ? process.env.DB_SYNC_ENABLED === "true"
    : process.env.NODE_ENV !== "production";

app.set("trust proxy", 1);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin not allowed."));
    },
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(compression());
app.use(cookieParser());
app.use(logger);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    time: Date.now(),
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Zamor Manager API is running",
  });
});

app.get("/api/assets/receipt-logo", (_req, res) => {
  const logoPath = getReceiptLogoPath();

  if (!logoPath) {
    return res.status(404).json({
      success: false,
      message: "Receipt logo not found.",
    });
  }

  res.setHeader("Content-Type", getReceiptLogoMimeType(logoPath));
  return fs.createReadStream(logoPath).pipe(res);
});

app.use("/api/auth", authRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/company-settings", companySettingsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/phones", phoneRoutes);
app.use("/api/repairs", repairRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/debts", debtRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/login-history", loginHistoryRoutes);
app.use("/api/backup", backupRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/natcash", natcashRoutes);
app.use("/api/recharges", rechargeRoutes);

if (fs.existsSync(buildPath)) {
  // dotfiles: 'allow' est nécessaire pour servir /.well-known/assetlinks.json (TWA Android)
  app.use(express.static(buildPath, { dotfiles: "allow" }));

  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.resolve(buildPath, "index.html"));
  });
}

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

app.use((error, req, res, _next) => {
  const statusCode = error.statusCode || 500;

  appLogger.error(`${req.method} ${req.originalUrl} — ${error.message}`, {
    statusCode,
    stack: error.stack,
  });

  if (process.env.SENTRY_DSN) {
    const Sentry = require("@sentry/node");
    Sentry.captureException(error);
  }

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500 && process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message || "Internal server error",
  });
});

const ensureCompanySettingsTable = async () => {
  const { mysqlPool } = require("./config/database");
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS company_settings (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      name VARCHAR(200) NOT NULL DEFAULT 'Zamor Multi Services Acces',
      logo_data MEDIUMTEXT,
      address VARCHAR(500) DEFAULT NULL,
      phone VARCHAR(100) DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  await mysqlPool.query(`
    INSERT IGNORE INTO company_settings (id, name, address, phone) VALUES
    (1, 'Zamor Multi Services Acces',
        'Sèka la source, kole ak antèn Digicel lan',
        '+1 (267) 254-4284 / +509 3217-2809')
  `);
};

const ensureRepairsTable = async () => {
  const { mysqlPool } = require("./config/database");
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS repairs (
      id                    INT UNSIGNED NOT NULL AUTO_INCREMENT,
      ticket                VARCHAR(20) NOT NULL,
      client_nom            VARCHAR(200) NOT NULL,
      client_telephone      VARCHAR(50) DEFAULT NULL,
      phone_id              INT UNSIGNED DEFAULT NULL,
      phone_description     VARCHAR(200) DEFAULT NULL,
      panne                 TEXT NOT NULL,
      cout_estimation       DECIMAL(12,2) DEFAULT NULL,
      cout_final            DECIMAL(12,2) DEFAULT NULL,
      statut                ENUM('en_attente','en_cours','termine','livre') NOT NULL DEFAULT 'en_attente',
      date_depot            DATE NOT NULL,
      date_livraison_estimee DATE DEFAULT NULL,
      date_livraison_reelle  DATE DEFAULT NULL,
      notes                 TEXT DEFAULT NULL,
      created_by            INT UNSIGNED NOT NULL,
      created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY idx_ticket (ticket),
      KEY idx_statut (statut),
      KEY idx_phone_id (phone_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const ensurePhonesTable = async () => {
  const { mysqlPool } = require("./config/database");
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS phones (
      id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
      imei            VARCHAR(20) NOT NULL,
      modele          VARCHAR(200) NOT NULL,
      couleur         VARCHAR(100) DEFAULT NULL,
      prix_achat      DECIMAL(12,2) NOT NULL,
      prix_vente      DECIMAL(12,2) NOT NULL,
      statut          ENUM('disponible','vendu','en_reparation') NOT NULL DEFAULT 'disponible',
      notes           TEXT DEFAULT NULL,
      sale_receipt_id INT UNSIGNED DEFAULT NULL,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY idx_imei (imei)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const ensureReceiptItemPhoneId = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable("receipt_items");
  if (!table.phone_id) {
    await queryInterface.addColumn("receipt_items", "phone_id", {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    });
  }
};

const ensureLoginAttemptsTable = async () => {
  const { mysqlPool } = require("./config/database");
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS login_attempts (
      ip      VARCHAR(45)  NOT NULL,
      count   INT UNSIGNED NOT NULL DEFAULT 1,
      reset_at DATETIME    NOT NULL,
      PRIMARY KEY (ip)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const ensureProductsTable = async () => {
  const { mysqlPool } = require("./config/database");
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      nom VARCHAR(255) NOT NULL,
      quantite_stock INT NOT NULL DEFAULT 0,
      seuil_alerte INT NOT NULL DEFAULT 5,
      prix_achat DECIMAL(12, 2) DEFAULT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

// Conversion UNSIGNED → INT signé pour permettre un stock négatif (vente sans blocage)
const ensureProductsQuantitySigned = async () => {
  const { mysqlPool } = require("./config/database");
  const [[col]] = await mysqlPool.query(
    `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME   = 'products'
       AND COLUMN_NAME  = 'quantite_stock'`
  );
  if (col && col.COLUMN_TYPE.includes("unsigned")) {
    await mysqlPool.query(
      "ALTER TABLE products MODIFY COLUMN quantite_stock INT NOT NULL DEFAULT 0"
    );
  }
};

const ensureReceiptItemPrixAchat = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable("receipt_items");

  if (!columns.prix_achat) {
    await queryInterface.addColumn("receipt_items", "prix_achat", {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: null,
    });
  }
};

const ensureReceiptItemProductId = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable("receipt_items");

  if (!columns.product_id) {
    await queryInterface.addColumn("receipt_items", "product_id", {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
    });
  }
};

const ensureClientsTable = async () => {
  const { mysqlPool } = require("./config/database");
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
      nom         VARCHAR(200) NOT NULL,
      telephone   VARCHAR(50)  DEFAULT NULL,
      email       VARCHAR(200) DEFAULT NULL,
      notes       TEXT         DEFAULT NULL,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_nom (nom)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const ensureDebtsTable = async () => {
  const { mysqlPool } = require("./config/database");
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS debts (
      id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
      client_id         INT UNSIGNED NOT NULL,
      sale_receipt_id   INT UNSIGNED DEFAULT NULL,
      montant_total     DECIMAL(12,2) NOT NULL,
      montant_paye      DECIMAL(12,2) NOT NULL DEFAULT 0,
      statut            ENUM('en_cours','remboursee','annulee') NOT NULL DEFAULT 'en_cours',
      notes             TEXT DEFAULT NULL,
      created_by        INT UNSIGNED NOT NULL,
      created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_client_id (client_id),
      KEY idx_statut (statut),
      KEY idx_sale_receipt_id (sale_receipt_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const ensureDebtPaymentsTable = async () => {
  const { mysqlPool } = require("./config/database");
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS debt_payments (
      id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
      debt_id         INT UNSIGNED NOT NULL,
      montant         DECIMAL(12,2) NOT NULL,
      mode_paiement   VARCHAR(50) NOT NULL DEFAULT 'Cash',
      date_paiement   DATE NOT NULL,
      note            TEXT DEFAULT NULL,
      created_by      INT UNSIGNED NOT NULL,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_debt_id (debt_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const ensureCompanyExchangeRate = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const cols = await queryInterface.describeTable("company_settings");
  if (!cols.exchange_rate) {
    await queryInterface.addColumn("company_settings", "exchange_rate", {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
      defaultValue: 132.0,
    });
  }
};

const ensureSaleReceiptDevise = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const cols = await queryInterface.describeTable("sale_receipts");
  if (!cols.devise) {
    await queryInterface.addColumn("sale_receipts", "devise", {
      type: DataTypes.ENUM("HTG", "USD"),
      allowNull: false,
      defaultValue: "HTG",
    });
  }
  if (!cols.taux_change) {
    await queryInterface.addColumn("sale_receipts", "taux_change", {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    });
  }
};

const ensureLoginHistoryTable = async () => {
  const { mysqlPool } = require("./config/database");
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS login_history (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id     INT UNSIGNED NULL,
      email       VARCHAR(200) NOT NULL,
      ip          VARCHAR(45)  NOT NULL,
      user_agent  VARCHAR(500),
      success     TINYINT(1)   NOT NULL DEFAULT 0,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_lh_user    (user_id),
      INDEX idx_lh_created (created_at),
      INDEX idx_lh_success (success)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};

const ensureNatcashTable = async () => {
  const { mysqlPool } = require("./config/database");
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS natcash_transactions (
      id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
      phone_number VARCHAR(20)  NOT NULL,
      client_name  VARCHAR(200) NOT NULL,
      amount       DECIMAL(12,2) NOT NULL,
      service_type ENUM('depot','retrait','transfert') NOT NULL,
      receipt_code VARCHAR(25)  NOT NULL,
      processed_by INT UNSIGNED NOT NULL,
      created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY idx_natcash_code (receipt_code),
      KEY idx_natcash_processed_by (processed_by),
      KEY idx_natcash_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const ensureRechargesTable = async () => {
  const { mysqlPool } = require("./config/database");
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS recharges (
      id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
      company      ENUM('natcom','digicel') NOT NULL,
      phone_number VARCHAR(20)  NOT NULL,
      amount       DECIMAL(12,2) NOT NULL,
      receipt_code VARCHAR(25)  NOT NULL,
      processed_by INT UNSIGNED NOT NULL,
      created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY idx_recharge_code (receipt_code),
      KEY idx_recharge_processed_by (processed_by),
      KEY idx_recharge_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const ensurePushSubscriptionsTable = async () => {
  const { mysqlPool } = require("./config/database");
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id    INT UNSIGNED NOT NULL,
      endpoint   VARCHAR(500) NOT NULL,
      p256dh     VARCHAR(200) NOT NULL,
      auth       VARCHAR(100) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_endpoint (endpoint(191)),
      INDEX idx_push_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const ensureUsersRoleGestionnaire = async () => {
  const { mysqlPool } = require("./config/database");
  const [[row]] = await mysqlPool.query(
    `SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`
  );
  if (row && !row.COLUMN_TYPE.includes("gestionnaire")) {
    await mysqlPool.query(
      `ALTER TABLE users
       MODIFY COLUMN role ENUM('admin','vendeur','gestionnaire') NOT NULL DEFAULT 'vendeur'`
    );
    appLogger.info("Migration: users.role ENUM étendu à admin|vendeur|gestionnaire");
  }
};

const ensureExpensesTable = async () => {
  const { mysqlPool } = require("./config/database");
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
      categorie     VARCHAR(100) NOT NULL,
      montant       DECIMAL(12,2) NOT NULL,
      date_depense  DATE NOT NULL,
      note          TEXT DEFAULT NULL,
      created_by    INT UNSIGNED NOT NULL,
      created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_categorie (categorie),
      KEY idx_date_depense (date_depense)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const ensureStockMovementsTable = async () => {
  const { mysqlPool } = require("./config/database");
  await mysqlPool.query(`
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      product_id INT UNSIGNED NOT NULL,
      type ENUM('sale', 'restock', 'adjustment', 'loss') NOT NULL,
      quantity INT NOT NULL,
      reference_id INT UNSIGNED DEFAULT NULL,
      note TEXT DEFAULT NULL,
      created_by INT UNSIGNED NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_product_id (product_id),
      KEY idx_reference_id (reference_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const ensureSaleReceiptSessionColumn = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const saleReceiptsTable = await queryInterface.describeTable("sale_receipts");

  if (!saleReceiptsTable.session_id) {
    await queryInterface.addColumn("sale_receipts", "session_id", {
      type: DataTypes.STRING(64),
      allowNull: true,
    });
  }

  const indexes = await queryInterface.showIndex("sale_receipts");
  const hasSessionIndex = indexes.some(
    (index) => index.name === "sale_receipts_session_id_unique"
  );

  if (!hasSessionIndex) {
    await queryInterface.addIndex("sale_receipts", ["session_id"], {
      name: "sale_receipts_session_id_unique",
      unique: true,
    });
  }
};

const startServer = async () => {
  try {
    await verifyDatabaseConnection();
    await sequelize.authenticate();

    // Toujours exécuté (idempotent et sans danger en production)
    await ensureLoginAttemptsTable();
    await ensureCompanySettingsTable();
    await ensurePhonesTable();
    await ensureRepairsTable();
    await ensureReceiptItemPhoneId();
    await ensureClientsTable();
    await ensureDebtsTable();
    await ensureDebtPaymentsTable();
    await ensureExpensesTable();
    await ensureCompanyExchangeRate();
    await ensureSaleReceiptDevise();
    await ensureUsersRoleGestionnaire();
    await ensureLoginHistoryTable();
    await ensurePushSubscriptionsTable();
    await ensureNatcashTable();
    await ensureRechargesTable();
    await ensureProductsTable();
    await ensureProductsQuantitySigned();
    await ensureReceiptItemPrixAchat();
    await ensureReceiptItemProductId();
    await ensureStockMovementsTable();

    if (databaseSchemaMutationsEnabled) {
      await sequelize.sync();
      await ensureSaleReceiptSessionColumn();
    }

    app.listen(PORT, () => {
      appLogger.info(`Server running on http://localhost:${PORT}`);
      scheduleBackup();
      warmBrowser(); // pré-chauffe Chromium pour éviter le cold-start PDF
    });
  } catch (error) {
    appLogger.error("Failed to start server:", { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

// En production (node server.js) : démarre immédiatement.
// En test (require('../server')) : exporte l'app et la promesse `ready`.
let _readyResolve, _readyReject;
const ready = new Promise((res, rej) => {
  _readyResolve = res;
  _readyReject = rej;
});

startServer().then(_readyResolve).catch(_readyReject);

module.exports = app;
module.exports.ready = ready;
