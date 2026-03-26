require("dotenv").config();

const compression = require("compression");
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
const { logger } = require("./middleware/logger");
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

if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));

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

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;

  if (process.env.NODE_ENV === "production") {
    console.error(`[error] ${error.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

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

    if (databaseSchemaMutationsEnabled) {
      await sequelize.sync();
      await ensureSaleReceiptSessionColumn();
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
