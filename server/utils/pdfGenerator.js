const puppeteer = require("puppeteer");

const { getLogoDataUri } = require("./receiptLogo");

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

const buildReceiptHtml = (receipt) => {
  const logoDataUri = getLogoDataUri();
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
          @page {
            size: 80mm auto;
            margin: 4mm;
          }
          body {
            width: 72mm;
            margin: 0 auto;
            color: #000;
            font-family: "Courier New", monospace;
            font-size: 11px;
            line-height: 1.45;
          }
          .logo-wrap {
            text-align: center;
            margin-bottom: 6px;
          }
          .logo {
            width: 22mm;
            max-width: 100%;
            height: auto;
            object-fit: contain;
          }
          .line {
            margin: 6px 0;
          }
          .center {
            text-align: center;
          }
          .number {
            text-align: right;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th,
          td {
            padding: 2px 0;
            text-align: left;
            vertical-align: top;
          }
          th:nth-child(2),
          td:nth-child(2),
          th:nth-child(3),
          td:nth-child(3),
          th:nth-child(4),
          td:nth-child(4) {
            text-align: right;
          }
        </style>
      </head>
      <body>
        <div class="line">---------------------------------</div>
        ${
          logoDataUri
            ? `<div class="logo-wrap"><img class="logo" src="${logoDataUri}" alt="Zamor logo" /></div>`
            : ""
        }
        <div class="center"><strong>Zamor Multi Services Acces</strong></div>
        <div>Adresse : Sèka la source, kole ak antèn Digicel lan</div>
        <div>Téléphone : +1 (267) 254-4284 / +509 3217-2809</div>
        <div class="line">---------------------------------</div>
        <div>Code reçu : ${escapeHtml(receipt.code_recu)}</div>
        <div>Date : ${formatDate(receipt.date)}</div>
        <div>Vendeur : ${escapeHtml(receipt.vendeur?.name || "")}</div>
        <div class="line">---------------------------------</div>
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Qté</th>
              <th>PU</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="line">---------------------------------</div>
        <div><strong>TOTAL GENERAL : ${formatNumber(receipt.total_general)} HTG</strong></div>
        <div>Mode paiement : ${escapeHtml(receipt.mode_paiement)}</div>
        <div>Signature vendeur : ${escapeHtml(receipt.signature_vendeur || "_______")}</div>
      </body>
    </html>
  `;
};

const generateReceiptPdf = async (receipt) => {
  const launchOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  };

  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    await page.setContent(buildReceiptHtml(receipt), {
      waitUntil: "load",
      timeout: 0,
    });

    return await page.pdf({
      width: "80mm",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });
  } finally {
    await browser.close();
  }
};

module.exports = {
  generateReceiptPdf,
};
