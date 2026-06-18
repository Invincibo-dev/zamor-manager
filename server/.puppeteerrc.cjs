const { join } = require("path");

/**
 * Puppeteer lira ce fichier automatiquement à deux moments :
 *  1. pendant `npx puppeteer browsers install chrome` (postinstall sur Render)
 *  2. pendant `puppeteer.launch()` à l'exécution
 *
 * PUPPETEER_CACHE_DIR doit pointer vers le même endroit aux deux étapes.
 * Sur Render : /opt/render/.cache/puppeteer (accessible en build ET en runtime).
 * En local : server/.cache/puppeteer (créé automatiquement, ignoré par git).
 */
module.exports = {
  cacheDirectory:
    process.env.PUPPETEER_CACHE_DIR ||
    join(__dirname, ".cache", "puppeteer"),
};
