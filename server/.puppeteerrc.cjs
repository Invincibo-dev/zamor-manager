const { join } = require("path");

/**
 * Puppeteer lit ce fichier aux deux moments critiques :
 *   1. `npx puppeteer browsers install chrome`  (postinstall, pendant le build)
 *   2. `puppeteer.launch()`                      (runtime)
 *
 * La variable RENDER=true est injectée par Render.com aux deux phases.
 * On s'en sert pour choisir le bon chemin SANS dépendre de PUPPETEER_CACHE_DIR
 * qui peut ne pas être disponible pendant le build si le Blueprint n'est pas synchronisé.
 *
 * Priorité :
 *   1. PUPPETEER_CACHE_DIR (si défini manuellement)
 *   2. /opt/render/.cache/puppeteer  (si on tourne sur Render)
 *   3. server/.cache/puppeteer       (développement local)
 */
module.exports = {
  cacheDirectory:
    process.env.PUPPETEER_CACHE_DIR ||
    (process.env.RENDER
      ? "/opt/render/.cache/puppeteer"
      : join(__dirname, ".cache", "puppeteer")),
};
