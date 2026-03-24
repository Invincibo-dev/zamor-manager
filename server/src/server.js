require("dotenv").config();

const app = require("./app");
const { testDatabaseConnection } = require("./config/db");
const { initializeModels } = require("./models");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await testDatabaseConnection();
    await initializeModels();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
