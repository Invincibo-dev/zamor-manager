const multer = require("multer");

const ALLOWED_MIMETYPES = ["image/jpeg", "image/png", "image/svg+xml"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

// memoryStorage : pas de fichier sur disque — on convertit en base64 dans le contrôleur.
// Nécessaire sur Render (free tier) dont le filesystem est éphémère.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    // Vérifie le vrai MIME type signalé par le navigateur (pas juste l'extension)
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        Object.assign(new Error("Type de fichier non autorisé. Utilisez JPG, PNG ou SVG."), {
          statusCode: 400,
        })
      );
    }
  },
});

module.exports = upload;
