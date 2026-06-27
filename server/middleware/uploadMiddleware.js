const multer = require("multer");

// SVG intentionnellement exclu : peut contenir du JavaScript exécutable (XSS stocké)
const ALLOWED_MIMETYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        Object.assign(new Error("Type de fichier non autorisé. Utilisez JPG ou PNG."), {
          statusCode: 400,
        })
      );
    }
  },
});

// Vérification des magic bytes réels du buffer (indépendant du Content-Type déclaré par le client).
// Disponible uniquement après upload complet en mémoire (memoryStorage).
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC  = [0x89, 0x50, 0x4e, 0x47];

const checkMagicBytes = (req, res, next) => {
  if (!req.file) return next();
  const buf = req.file.buffer;
  const isJpeg = buf.length >= 3 && JPEG_MAGIC.every((b, i) => buf[i] === b);
  const isPng  = buf.length >= 4 && PNG_MAGIC.every((b, i) => buf[i] === b);
  if (!isJpeg && !isPng) {
    return res.status(400).json({
      success: false,
      message: "Fichier invalide. Seuls les formats JPEG et PNG sont acceptés.",
    });
  }
  next();
};

module.exports = { upload, checkMagicBytes };
