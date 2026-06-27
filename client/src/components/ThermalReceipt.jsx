import { useCompany } from "../context/CompanyContext";

const SEP = "-".repeat(28);

const fmt = (v) =>
  Number(v || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SERVICE_LABELS = { depot: "DEPOT", retrait: "RETRAIT", transfert: "TRANSFERT" };

function Row({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>{label}</span>
      <span style={bold ? { fontWeight: "bold" } : {}}>{value}</span>
    </div>
  );
}

export default function ThermalReceipt({ type, data }) {
  const { settings } = useCompany();
  const company = settings || {};
  const companyName = company.name || "Zamor Multi Services";
  const companyAddress = company.address || "";
  const companyPhone = company.phone || "";

  const createdAt = data.created_at ? new Date(data.created_at) : new Date();
  const dateStr = createdAt.toLocaleDateString("fr-FR");
  const timeStr = createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const root = {
    width: "52mm",
    margin: "0 auto",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "11px",
    lineHeight: "1.45",
    color: "#000",
  };
  const center = { textAlign: "center" };
  const small = { fontSize: "10px" };

  return (
    <div style={root}>
      {/* Header */}
      <div style={{ ...center, marginBottom: "3px" }}>
        <div style={{ fontWeight: "bold", fontSize: "12px" }}>{companyName}</div>
        {companyAddress && <div style={small}>{companyAddress}</div>}
        {companyPhone && <div style={small}>Tel: {companyPhone}</div>}
      </div>

      <div>{SEP}</div>

      {/* Service title */}
      <div style={{ ...center, fontWeight: "bold", margin: "2px 0" }}>
        {type === "natcash"
          ? `NATCASH — ${SERVICE_LABELS[data.service_type] || data.service_type}`
          : `RECHARGE ${(data.company || "").toUpperCase()}`}
      </div>

      <div style={small}>
        <Row label="Date" value={dateStr} />
        <Row label="Heure" value={timeStr} />
      </div>

      <div>{SEP}</div>

      {/* Details */}
      {type === "natcash" ? (
        <div>
          <Row label="Client" value={data.client_name} />
          <Row label="Tel" value={data.phone_number} />
          <div style={{ margin: "2px 0" }}>{SEP}</div>
          <Row label="Montant HTG" value={fmt(data.amount)} bold />
        </div>
      ) : (
        <div>
          <Row label="Compagnie" value={data.company === "natcom" ? "Natcom" : "Digicel"} />
          <Row label="Numero" value={data.phone_number} />
          <div style={{ margin: "2px 0" }}>{SEP}</div>
          <Row label="Montant HTG" value={fmt(data.amount)} bold />
        </div>
      )}

      <div style={{ marginTop: "2px" }}>{SEP}</div>

      {/* Footer */}
      <div style={small}>
        <div>Code: {data.receipt_code}</div>
        <div>Traite par: {data.processed_by_name || ""}</div>
      </div>

      <div>{SEP}</div>

      <div style={{ ...center, ...small }}>Merci pour votre confiance !</div>
    </div>
  );
}
