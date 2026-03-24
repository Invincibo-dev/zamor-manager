const fs = require("fs");
const path = require("path");

const getReceiptLogoPath = () => {
  const candidatePaths = [
    process.env.RECEIPT_LOGO_PATH,
    path.join(__dirname, "..", "assets", "zamor-logo.png"),
    path.join(__dirname, "..", "assets", "zamor-logo.jpg"),
    path.join(__dirname, "..", "assets", "zamor-logo.jpeg"),
    path.join(__dirname, "..", "assets", "zamor-logo.png.jpeg"),
  ].filter(Boolean);

  return candidatePaths.find((candidate) => fs.existsSync(candidate)) || null;
};

const getReceiptLogoMimeType = (logoPath) => {
  const extension = path.extname(logoPath).toLowerCase();

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "image/png";
};

const getLogoDataUri = () => {
  const logoPath = getReceiptLogoPath();

  if (!logoPath) {
    return null;
  }

  const imageBuffer = fs.readFileSync(logoPath);
  const mimeType = getReceiptLogoMimeType(logoPath);

  return `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
};

module.exports = {
  getReceiptLogoPath,
  getReceiptLogoMimeType,
  getLogoDataUri,
};
