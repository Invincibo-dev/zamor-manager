const puppeteer = require("puppeteer");

const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const formatCurrency = (value) => {
  return `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} HTG`;
};

const formatDate = (value) => {
  const date = new Date(value);

  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const buildReceiptHtml = (receipt) => {
  const rowsHtml = receipt.produits
    .map(
      (produit) => `
        <tr>
          <td>${escapeHtml(produit.nom_produit)}</td>
          <td>${escapeHtml(produit.quantite)}</td>
          <td>${Number(produit.prix_unitaire || 0)}</td>
          <td>${Number(produit.total || 0)}</td>
        </tr>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Recu ${escapeHtml(receipt.code_recu)}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 4mm;
          }
          body {
            width: 72mm;
            margin: 0 auto;
            font-family: "Courier New", Courier, monospace;
            color: #000;
            font-size: 11px;
            line-height: 1.45;
          }
          .separator {
            margin: 6px 0;
            white-space: pre;
          }
          .center {
            text-align: center;
          }
          .meta-line {
            margin: 2px 0;
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
        <div class="separator">---------------------------------</div>
        <div class="center"><strong>Zamor Multi Services Acces</strong></div>
        <div class="meta-line">Adresse : Sèka la source, kole ak antèn Digicel lan</div>
        <div class="meta-line">Téléphone : +1 (267) 254-4284</div>
        <div class="meta-line">Téléphone : +509 3217-2809</div>
        <div class="separator">---------------------------------</div>

        <div class="meta-line">Code Reçu : ${escapeHtml(receipt.code_recu)}</div>
        <div class="meta-line">Date : ${escapeHtml(formatDate(receipt.date))}</div>
        <div class="meta-line">Vendeur : ${escapeHtml(receipt.vendeur_nom || "")}</div>

        <div class="separator">---------------------------------</div>
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Qté</th>
              <th>PU</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
        <div class="separator">---------------------------------</div>
        <div class="meta-line"><strong>TOTAL GENERAL : ${formatCurrency(receipt.total_general)}</strong></div>
        <div class="meta-line">Mode paiement : ${escapeHtml(receipt.mode_paiement)}</div>
        <div class="meta-line">Signature vendeur : _______</div>
        <div class="separator">---------------------------------</div>
        <div class="center">Merci pour votre achat</div>
      </body>
    </html>
  `;
};

const generateReceiptPdf = async (receipt) => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();
    const html = buildReceiptHtml(receipt);

    await page.setContent(html, {
      waitUntil: "networkidle0",
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
