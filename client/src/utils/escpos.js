// ESC/POS command builder — 58mm thermal printers (PT-210, etc.)
// Produces a Uint8Array ready to send via Web Serial.

const ESC = 0x1b;
const GS  = 0x1d;

const cmd = (...bytes) => Uint8Array.from(bytes);

export const INIT        = cmd(ESC, 0x40);           // Initialize printer
export const BOLD_ON     = cmd(ESC, 0x45, 1);
export const BOLD_OFF    = cmd(ESC, 0x45, 0);
export const ALIGN_LEFT  = cmd(ESC, 0x61, 0);
export const ALIGN_CENTER= cmd(ESC, 0x61, 1);
export const ALIGN_RIGHT = cmd(ESC, 0x61, 2);
export const FEED_LINE   = cmd(0x0a);
export const FEED_3      = cmd(ESC, 0x64, 3);        // Feed 3 lines
export const CUT         = cmd(GS, 0x56, 0x41, 0x03);// Partial cut

const enc = new TextEncoder();

const text = (s) => enc.encode(s);

const concat = (...parts) => {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let offset = 0;
  for (const p of parts) { out.set(p, offset); offset += p.length; }
  return out;
};

const pad = (left, right, width = 32) => {
  const gap = Math.max(1, width - left.length - right.length);
  return left + " ".repeat(gap) + right;
};

const fmt = (n) =>
  Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const line = (s = "") => concat(text(s), FEED_LINE);
const dashes = () => line("--------------------------------");

export const buildReceiptEscPos = (receipt, company = {}) => {
  const companyName = company.name || "Zamor Multi Services Acces";
  const companyPhone = company.phone || "";
  const devise = receipt.devise || "HTG";

  const dateStr = new Date(receipt.date).toLocaleDateString("fr-FR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });

  const parts = [
    INIT,
    ALIGN_CENTER,
    BOLD_ON,  line(companyName), BOLD_OFF,
    companyPhone ? line(companyPhone) : new Uint8Array(0),
    dashes(),
    ALIGN_LEFT,
    line(`Code : ${receipt.code_recu}`),
    line(`Date : ${dateStr}`),
    line(`Vendeur : ${receipt.vendeur?.name || ""}`),
    dashes(),
  ];

  // Items
  for (const item of receipt.items || []) {
    parts.push(line(String(item.nom_produit).slice(0, 32)));
    parts.push(line(pad(`  x${item.quantite} @ ${fmt(item.prix_unitaire)}`, `${fmt(item.total)} ${devise}`)));
  }

  parts.push(
    dashes(),
    BOLD_ON,
    line(pad("TOTAL", `${fmt(receipt.total_general)} ${devise}`)),
    BOLD_OFF,
    line(`Mode : ${receipt.mode_paiement}`),
  );

  if (receipt.devise === "USD" && receipt.taux_change) {
    const htg = Number(receipt.total_general) * Number(receipt.taux_change);
    parts.push(line(`       (≈ ${fmt(htg)} HTG)`));
  }

  parts.push(
    dashes(),
    ALIGN_CENTER,
    line("Mèsi anpil!"),
    FEED_3,
    CUT,
  );

  return concat(...parts);
};
