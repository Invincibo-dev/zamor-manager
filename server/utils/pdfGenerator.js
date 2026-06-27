const { existsSync } = require("fs");

const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

const { getLogoDataUri } = require("./receiptLogo");
const appLogger = require("./logger");

// ─── HTML builder ─────────────────────────────────────────────────────────────

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) =>
  new Date(value).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

const buildReceiptHtml = (receipt, company = {}) => {
  const logoDataUri = company.logo_data || getLogoDataUri();
  const companyName = company.name || "Zamor Multi Services Acces";
  const companyAddress = company.address || "Sèka la source, kole ak antèn Digicel lan";
  const companyPhone = company.phone || "+1 (267) 254-4284 / +509 3217-2809";

  const devise = receipt.devise || "HTG";
  const rows = receipt.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.nom_produit)}</td>
          <td class="number">${item.quantite}</td>
          <td class="number">${formatNumber(item.prix_unitaire)}</td>
          <td class="number">${formatNumber(item.total)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Recu ${escapeHtml(receipt.code_recu)}</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          body {
            width: 72mm; margin: 0 auto; color: #000;
            font-family: "Courier New", monospace; font-size: 11px; line-height: 1.45;
          }
          .logo-wrap { text-align: center; margin-bottom: 6px; }
          .logo { width: 22mm; max-width: 100%; height: auto; object-fit: contain; }
          .line { margin: 6px 0; }
          .center { text-align: center; }
          .number { text-align: right; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 2px 0; text-align: left; vertical-align: top; }
          th:nth-child(2), td:nth-child(2),
          th:nth-child(3), td:nth-child(3),
          th:nth-child(4), td:nth-child(4) { text-align: right; }
        </style>
      </head>
      <body>
        <div class="line">---------------------------------</div>
        ${logoDataUri
          ? `<div class="logo-wrap"><img class="logo" src="${logoDataUri}" alt="${escapeHtml(companyName)}" /></div>`
          : ""}
        <div class="center"><strong>${escapeHtml(companyName)}</strong></div>
        ${companyAddress ? `<div>Adresse : ${escapeHtml(companyAddress)}</div>` : ""}
        ${companyPhone ? `<div>Téléphone : ${escapeHtml(companyPhone)}</div>` : ""}
        <div class="line">---------------------------------</div>
        <div>Code reçu : ${escapeHtml(receipt.code_recu)}</div>
        <div>Date : ${formatDate(receipt.date)}</div>
        <div>Vendeur : ${escapeHtml(receipt.vendeur?.name || "")}</div>
        <div class="line">---------------------------------</div>
        <table>
          <thead>
            <tr><th>Nom</th><th>Qté</th><th>PU</th><th>Total</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="line">---------------------------------</div>
        <div><strong>TOTAL GENERAL : ${formatNumber(receipt.total_general)} ${escapeHtml(devise)}</strong></div>
        <div>Mode paiement : ${escapeHtml(receipt.mode_paiement)}</div>
        <div>Signature vendeur : ${escapeHtml(receipt.signature_vendeur || "_______")}</div>
      </body>
    </html>
  `;
};

// ─── Browser singleton (keep-alive) ──────────────────────────────────────────
// Un seul processus Chromium reste ouvert entre les requêtes.
// Élimine le cold-start (~15s) qui causait des timeouts sur Render.

let _browserPromise = null;

const _launchBrowser = async () => {
  chromium.setGraphicsMode = false;

  const executablePath =
    process.env.PUPPETEER_EXECUTABLE_PATH || (await chromium.executablePath());

  appLogger.info(`[PDF] Lancement Chromium — binary: ${executablePath} (exists: ${existsSync(executablePath)})`);

  const browser = await puppeteer.launch({
    args: [...chromium.args, "--disable-gpu"],
    executablePath,
    headless: "shell",
  });

  browser.on("disconnected", () => {
    appLogger.warn("[PDF] Browser déconnecté — sera relancé à la prochaine requête.");
    _browserPromise = null;
  });

  appLogger.info("[PDF] Browser prêt.");
  return browser;
};

const getBrowser = () => {
  if (!_browserPromise) {
    _browserPromise = _launchBrowser().catch((err) => {
      _browserPromise = null; // permet de réessayer
      throw err;
    });
  }
  return _browserPromise;
};

// ─── PDF cache en mémoire ─────────────────────────────────────────────────────
// Clé = receipt.id (integer). Un reçu ne change jamais après création.
// Limité à MAX_CACHE_SIZE entrées — purge FIFO si dépassé.

const MAX_CACHE_SIZE = 200;
const _pdfCache = new Map(); // id → Buffer

const _cacheSet = (id, buffer) => {
  if (_pdfCache.size >= MAX_CACHE_SIZE) {
    const firstKey = _pdfCache.keys().next().value;
    _pdfCache.delete(firstKey);
  }
  _pdfCache.set(id, buffer);
};

// ─── Queue mutex ──────────────────────────────────────────────────────────────
// Au plus une page Chromium active à la fois → évite les OOM sur 512 MB.

let _pdfQueue = Promise.resolve();

const _runPdf = async (receipt, company) => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(buildReceiptHtml(receipt, company), {
      waitUntil: "load",
      timeout: 0,
    });
    return await page.pdf({
      width: "80mm",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
  } finally {
    await page.close();
  }
};

// ─── Public API ───────────────────────────────────────────────────────────────

const generateReceiptPdf = (receipt, company = {}) => {
  // Retourne le cache si disponible
  if (receipt.id && _pdfCache.has(receipt.id)) {
    return Promise.resolve(_pdfCache.get(receipt.id));
  }

  const queued = _pdfQueue.then(async () => {
    // Double-check cache après attente dans la queue
    if (receipt.id && _pdfCache.has(receipt.id)) {
      return _pdfCache.get(receipt.id);
    }
    const buffer = await _runPdf(receipt, company);
    if (receipt.id) _cacheSet(receipt.id, buffer);
    return buffer;
  });

  // Absorbe les erreurs pour ne pas bloquer la queue
  _pdfQueue = queued.catch(() => {});
  return queued;
};

// Appelé au démarrage du serveur pour pré-chauffer Chromium.
// Erreurs ignorées — le serveur démarre même si Chromium échoue.
const warmBrowser = () => {
  getBrowser().catch((err) =>
    appLogger.warn(`[PDF] Pré-chauffage échoué (non-bloquant): ${err.message}`)
  );
};

module.exports = { generateReceiptPdf, warmBrowser };
