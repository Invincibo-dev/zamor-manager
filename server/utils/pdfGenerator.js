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

// ─── Natcash PDF ──────────────────────────────────────────────────────────────

const TYPE_LABELS = { depot: "Dépôt", retrait: "Retrait", transfert: "Transfert" };

const buildNatcashHtml = (tx, company = {}) => {
  const logoDataUri = company.logo_data || getLogoDataUri();
  const companyName = company.name || "Zamor Multi Services Acces";
  const companyAddress = company.address || "";
  const companyPhone = company.phone || "";
  const typeLabel = TYPE_LABELS[tx.service_type] || tx.service_type;
  const heure = new Date(tx.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return `<!doctype html>
  <html lang="fr"><head><meta charset="utf-8" /><title>Natcash ${escapeHtml(tx.receipt_code)}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    body { width: 72mm; margin: 0 auto; color: #000; font-family: "Courier New", monospace; font-size: 11px; line-height: 1.5; }
    .logo-wrap { text-align: center; margin-bottom: 6px; }
    .logo { width: 22mm; max-width: 100%; height: auto; object-fit: contain; }
    .sep { margin: 6px 0; }
    .center { text-align: center; }
  </style></head><body>
  <div class="sep">---------------------------------</div>
  ${logoDataUri ? `<div class="logo-wrap"><img class="logo" src="${logoDataUri}" alt="" /></div>` : ""}
  <div class="center"><strong>${escapeHtml(companyName)}</strong></div>
  ${companyAddress ? `<div>Adresse : ${escapeHtml(companyAddress)}</div>` : ""}
  ${companyPhone ? `<div>Téléphone : ${escapeHtml(companyPhone)}</div>` : ""}
  <div class="sep">---------------------------------</div>
  <div class="center"><strong>SERVICE NATCASH — ${escapeHtml(typeLabel.toUpperCase())}</strong></div>
  <div class="sep">---------------------------------</div>
  <div>Code : ${escapeHtml(tx.receipt_code)}</div>
  <div>Date : ${formatDate(tx.created_at)} ${escapeHtml(heure)}</div>
  <div class="sep">---------------------------------</div>
  <div>Client : ${escapeHtml(tx.client_name)}</div>
  <div>Téléphone : ${escapeHtml(tx.phone_number)}</div>
  <div class="sep">---------------------------------</div>
  <div><strong>Montant : ${formatNumber(tx.amount)} HTG</strong></div>
  <div class="sep">---------------------------------</div>
  <div>Traité par : ${escapeHtml(tx.processed_by_name || "")}</div>
  <div class="sep">---------------------------------</div>
  <div class="center">Mèsi anpil !</div>
  </body></html>`;
};

// ─── Recharge PDF ─────────────────────────────────────────────────────────────

const buildRechargeHtml = (rc, company = {}) => {
  const logoDataUri = company.logo_data || getLogoDataUri();
  const companyName = company.name || "Zamor Multi Services Acces";
  const companyAddress = company.address || "";
  const companyPhone = company.phone || "";
  const companyLabel = rc.company === "natcom" ? "Natcom" : "Digicel";
  const heure = new Date(rc.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return `<!doctype html>
  <html lang="fr"><head><meta charset="utf-8" /><title>Recharge ${escapeHtml(rc.receipt_code)}</title>
  <style>
    @page { size: 80mm auto; margin: 4mm; }
    body { width: 72mm; margin: 0 auto; color: #000; font-family: "Courier New", monospace; font-size: 11px; line-height: 1.5; }
    .logo-wrap { text-align: center; margin-bottom: 6px; }
    .logo { width: 22mm; max-width: 100%; height: auto; object-fit: contain; }
    .sep { margin: 6px 0; }
    .center { text-align: center; }
  </style></head><body>
  <div class="sep">---------------------------------</div>
  ${logoDataUri ? `<div class="logo-wrap"><img class="logo" src="${logoDataUri}" alt="" /></div>` : ""}
  <div class="center"><strong>${escapeHtml(companyName)}</strong></div>
  ${companyAddress ? `<div>Adresse : ${escapeHtml(companyAddress)}</div>` : ""}
  ${companyPhone ? `<div>Téléphone : ${escapeHtml(companyPhone)}</div>` : ""}
  <div class="sep">---------------------------------</div>
  <div class="center"><strong>RECHARGE ${escapeHtml(companyLabel.toUpperCase())}</strong></div>
  <div class="sep">---------------------------------</div>
  <div>Code : ${escapeHtml(rc.receipt_code)}</div>
  <div>Date : ${formatDate(rc.created_at)} ${escapeHtml(heure)}</div>
  <div class="sep">---------------------------------</div>
  <div>Numéro rechargé : ${escapeHtml(rc.phone_number)}</div>
  <div class="sep">---------------------------------</div>
  <div><strong>Montant : ${formatNumber(rc.amount)} HTG</strong></div>
  <div class="sep">---------------------------------</div>
  <div>Traité par : ${escapeHtml(rc.processed_by_name || "")}</div>
  <div class="sep">---------------------------------</div>
  <div class="center">Mèsi anpil !</div>
  </body></html>`;
};

const _runServicePdf = async (html) => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load", timeout: 0 });
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

const generateNatcashPdf = (tx, company = {}) => {
  const cacheKey = `nat_${tx.id}`;
  if (tx.id && _pdfCache.has(cacheKey)) return Promise.resolve(_pdfCache.get(cacheKey));
  const queued = _pdfQueue.then(async () => {
    if (tx.id && _pdfCache.has(cacheKey)) return _pdfCache.get(cacheKey);
    const buffer = await _runServicePdf(buildNatcashHtml(tx, company));
    if (tx.id) _cacheSet(cacheKey, buffer);
    return buffer;
  });
  _pdfQueue = queued.catch(() => {});
  return queued;
};

const generateRechargePdf = (rc, company = {}) => {
  const cacheKey = `rch_${rc.id}`;
  if (rc.id && _pdfCache.has(cacheKey)) return Promise.resolve(_pdfCache.get(cacheKey));
  const queued = _pdfQueue.then(async () => {
    if (rc.id && _pdfCache.has(cacheKey)) return _pdfCache.get(cacheKey);
    const buffer = await _runServicePdf(buildRechargeHtml(rc, company));
    if (rc.id) _cacheSet(cacheKey, buffer);
    return buffer;
  });
  _pdfQueue = queued.catch(() => {});
  return queued;
};

// ─── A4 report runner (no cache — dynamic per period) ─────────────────────────

const _runReportPdf = async (html) => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load", timeout: 0 });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", right: "15mm", bottom: "18mm", left: "15mm" },
    });
  } finally {
    await page.close();
  }
};

const REPORT_STYLES = `
  @page { size: A4; margin: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; margin: 0; padding: 18mm 15mm; }
  .header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
  .logo { width: 48px; height: 48px; object-fit: contain; flex-shrink: 0; }
  .co-name { font-size: 15px; font-weight: 700; }
  .co-sub { font-size: 10px; color: #64748b; }
  h1 { font-size: 17px; font-weight: 700; margin: 0 0 3px; }
  .period { font-size: 11px; color: #64748b; margin-bottom: 16px; }
  .kpi-row { display: flex; gap: 10px; margin-bottom: 20px; }
  .kpi { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; }
  .kpi-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; }
  .kpi-value { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 2px; }
  .kpi-sub { font-size: 9px; color: #64748b; margin-top: 1px; }
  .section-title { font-size: 11px; font-weight: 600; color: #334155; margin: 16px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; page-break-inside: auto; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  thead tr { background: #f1f5f9; }
  th { padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
  td { padding: 5px 8px; border-bottom: 1px solid #f8fafc; }
  .num { text-align: right; }
  .badge { padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
  .bd { color: #15803d; background: #dcfce7; }
  .br { color: #b91c1c; background: #fee2e2; }
  .bt { color: #1d4ed8; background: #dbeafe; }
  .bn { color: #1d4ed8; background: #dbeafe; }
  .bdi { color: #b91c1c; background: #fee2e2; }
  .footer { margin-top: 24px; font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 10px; }
`;

// ─── Natcash report PDF ───────────────────────────────────────────────────────

const buildNatcashReportHtml = (report, company = {}) => {
  const logoDataUri = company.logo_data || getLogoDataUri();
  const companyName = escapeHtml(company.name || "Zamor Multi Services Acces");
  const companyAddress = company.address ? escapeHtml(company.address) : "";
  const companyPhone = company.phone ? escapeHtml(company.phone) : "";
  const genDate = new Date().toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const TYPE_LABELS = { depot: "Dépôt", retrait: "Retrait", transfert: "Transfert" };
  const BADGE_CLASSES = { depot: "bd", retrait: "br", transfert: "bt" };

  const breakdownRows = ["depot", "retrait", "transfert"]
    .filter((t) => report.breakdown[t])
    .map((t) => {
      const s = report.breakdown[t];
      return `<tr><td><span class="badge ${BADGE_CLASSES[t]}">${TYPE_LABELS[t]}</span></td><td class="num">${s.count}</td><td class="num">${formatNumber(s.amount)} HTG</td></tr>`;
    })
    .join("");

  const txRows = report.transactions.map((tx) => {
    const dt = new Date(tx.created_at);
    const dateStr = dt.toLocaleDateString("fr-FR");
    const timeStr = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const t = tx.service_type;
    return `<tr>
      <td>${escapeHtml(dateStr)} ${escapeHtml(timeStr)}</td>
      <td>${escapeHtml(tx.client_name)}</td>
      <td>${escapeHtml(tx.phone_number)}</td>
      <td><span class="badge ${BADGE_CLASSES[t] || ""}">${TYPE_LABELS[t] || escapeHtml(t)}</span></td>
      <td class="num">${formatNumber(tx.amount)} HTG</td>
      <td>${escapeHtml(tx.processed_by_name || "")}</td>
    </tr>`;
  }).join("");

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8" />
<title>Rapport Natcash — ${escapeHtml(report.dateLabel)}</title>
<style>${REPORT_STYLES}</style></head><body>
  <div class="header">
    ${logoDataUri ? `<img class="logo" src="${logoDataUri}" alt="" />` : ""}
    <div>
      <div class="co-name">${companyName}</div>
      <div class="co-sub">${[companyAddress, companyPhone].filter(Boolean).join(" · ")}</div>
    </div>
  </div>

  <h1>Rapport Natcash</h1>
  <div class="period">Période : ${escapeHtml(report.dateLabel)}</div>

  <div class="kpi-row">
    <div class="kpi">
      <div class="kpi-label">Total transactions</div>
      <div class="kpi-value">${report.total}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Montant total traité</div>
      <div class="kpi-value">${formatNumber(report.total_amount)}</div>
      <div class="kpi-sub">HTG</div>
    </div>
  </div>

  <div class="section-title">Répartition par type</div>
  <table>
    <thead><tr><th>Type</th><th class="num">Nb transactions</th><th class="num">Montant total</th></tr></thead>
    <tbody>${breakdownRows || "<tr><td colspan='3' style='color:#94a3b8'>Aucune donnée</td></tr>"}</tbody>
  </table>

  ${report.transactions.length > 0 ? `
  <div class="section-title">Détail des transactions</div>
  <table>
    <thead><tr><th>Date / Heure</th><th>Client</th><th>Téléphone</th><th>Type</th><th class="num">Montant</th><th>Employé</th></tr></thead>
    <tbody>${txRows}</tbody>
  </table>` : ""}

  <div class="footer">Rapport généré le ${escapeHtml(genDate)} — Zamor Manager</div>
</body></html>`;
};

const generateNatcashReportPdf = (report, company = {}) => {
  const queued = _pdfQueue.then(() => _runReportPdf(buildNatcashReportHtml(report, company)));
  _pdfQueue = queued.catch(() => {});
  return queued;
};

// ─── Recharges report PDF ─────────────────────────────────────────────────────

const buildRechargesReportHtml = (report, company = {}) => {
  const logoDataUri = company.logo_data || getLogoDataUri();
  const companyName = escapeHtml(company.name || "Zamor Multi Services Acces");
  const companyAddress = company.address ? escapeHtml(company.address) : "";
  const companyPhone = company.phone ? escapeHtml(company.phone) : "";
  const genDate = new Date().toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const COMPANY_LABELS = { natcom: "Natcom", digicel: "Digicel" };
  const BADGE_CLASSES = { natcom: "bn", digicel: "bdi" };

  const breakdownRows = ["natcom", "digicel"]
    .filter((c) => report.breakdown[c])
    .map((c) => {
      const s = report.breakdown[c];
      return `<tr><td><span class="badge ${BADGE_CLASSES[c]}">${COMPANY_LABELS[c]}</span></td><td class="num">${s.count}</td><td class="num">${formatNumber(s.amount)} HTG</td></tr>`;
    })
    .join("");

  const rcRows = report.recharges.map((rc) => {
    const dt = new Date(rc.created_at);
    const dateStr = dt.toLocaleDateString("fr-FR");
    const timeStr = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    return `<tr>
      <td>${escapeHtml(dateStr)} ${escapeHtml(timeStr)}</td>
      <td><span class="badge ${BADGE_CLASSES[rc.company] || ""}">${COMPANY_LABELS[rc.company] || escapeHtml(rc.company)}</span></td>
      <td>${escapeHtml(rc.phone_number)}</td>
      <td class="num">${formatNumber(rc.amount)} HTG</td>
      <td>${escapeHtml(rc.processed_by_name || "")}</td>
    </tr>`;
  }).join("");

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8" />
<title>Rapport Recharges — ${escapeHtml(report.dateLabel)}</title>
<style>${REPORT_STYLES}</style></head><body>
  <div class="header">
    ${logoDataUri ? `<img class="logo" src="${logoDataUri}" alt="" />` : ""}
    <div>
      <div class="co-name">${companyName}</div>
      <div class="co-sub">${[companyAddress, companyPhone].filter(Boolean).join(" · ")}</div>
    </div>
  </div>

  <h1>Rapport Recharges</h1>
  <div class="period">Période : ${escapeHtml(report.dateLabel)}</div>

  <div class="kpi-row">
    <div class="kpi">
      <div class="kpi-label">Total recharges</div>
      <div class="kpi-value">${report.total}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Montant total rechargé</div>
      <div class="kpi-value">${formatNumber(report.total_amount)}</div>
      <div class="kpi-sub">HTG</div>
    </div>
  </div>

  <div class="section-title">Répartition par compagnie</div>
  <table>
    <thead><tr><th>Compagnie</th><th class="num">Nb recharges</th><th class="num">Montant total</th></tr></thead>
    <tbody>${breakdownRows || "<tr><td colspan='3' style='color:#94a3b8'>Aucune donnée</td></tr>"}</tbody>
  </table>

  ${report.recharges.length > 0 ? `
  <div class="section-title">Détail des recharges</div>
  <table>
    <thead><tr><th>Date / Heure</th><th>Compagnie</th><th>Numéro</th><th class="num">Montant</th><th>Employé</th></tr></thead>
    <tbody>${rcRows}</tbody>
  </table>` : ""}

  <div class="footer">Rapport généré le ${escapeHtml(genDate)} — Zamor Manager</div>
</body></html>`;
};

const generateRechargesReportPdf = (report, company = {}) => {
  const queued = _pdfQueue.then(() => _runReportPdf(buildRechargesReportHtml(report, company)));
  _pdfQueue = queued.catch(() => {});
  return queued;
};

module.exports = { generateReceiptPdf, generateNatcashPdf, generateRechargePdf, generateNatcashReportPdf, generateRechargesReportPdf, warmBrowser };
