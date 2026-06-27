import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { createNatcash, listNatcash, downloadNatcashPdf } from "../services/natcashApi";
import { getStoredUser } from "../utils/auth";

const fmt = (v) =>
  Number(v || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " HTG";

const TYPE_LABELS = { depot: "Dépôt", retrait: "Retrait", transfert: "Transfert" };

const today = () => new Date().toISOString().slice(0, 10);

// ─── Success panel ─────────────────────────────────────────────────────────────
function SuccessPanel({ transaction, onNew }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const label = TYPE_LABELS[transaction.service_type] || transaction.service_type;

  const handlePdf = async () => {
    setPdfLoading(true);
    try { await downloadNatcashPdf(transaction.receipt_code); }
    catch (e) { alert(e.message); }
    finally { setPdfLoading(false); }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-green-200 bg-green-50 p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white text-2xl">✓</div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-green-700 mb-1">Transaction enregistrée</p>
      <p className="text-2xl font-bold text-green-900 mb-4">{transaction.receipt_code}</p>
      <div className="rounded-2xl bg-white p-4 text-left space-y-2 text-sm mb-4">
        <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-semibold">{label}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Client</span><span className="font-semibold">{transaction.client_name}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Téléphone</span><span className="font-semibold">{transaction.phone_number}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Montant</span><span className="font-bold text-green-700">{fmt(transaction.amount)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Traité par</span><span className="font-semibold">{transaction.processed_by_name}</span></div>
      </div>
      <div className="flex gap-3">
        <button onClick={handlePdf} disabled={pdfLoading}
          className="flex-1 rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
          {pdfLoading ? "Chargement..." : "Télécharger PDF"}
        </button>
        <button onClick={onNew}
          className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          Nouvelle transaction
        </button>
      </div>
    </div>
  );
}

// ─── Form ──────────────────────────────────────────────────────────────────────
function NatcashForm({ onSuccess }) {
  const [form, setForm] = useState({ phone_number: "", client_name: "", amount: "", service_type: "depot" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await createNatcash({ ...form, amount: Number(form.amount) });
      onSuccess(data.transaction);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";
  const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400";

  return (
    <form onSubmit={submit} className="mx-auto max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.18)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">Nouvelle transaction</p>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div>
        <label className={labelCls}>Type de service *</label>
        <select value={form.service_type} onChange={handle("service_type")} required className={inputCls}>
          <option value="depot">Dépôt</option>
          <option value="retrait">Retrait</option>
          <option value="transfert">Transfert</option>
        </select>
      </div>

      <div>
        <label className={labelCls}>Numéro de téléphone client *</label>
        <input type="tel" value={form.phone_number} onChange={handle("phone_number")} required placeholder="Ex: 50936789012" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Nom du client *</label>
        <input type="text" value={form.client_name} onChange={handle("client_name")} required placeholder="Ex: Jean Pierre" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Montant (HTG) *</label>
        <input type="number" min="1" step="0.01" value={form.amount} onChange={handle("amount")} required placeholder="Ex: 5000" className={inputCls} />
      </div>

      <button type="submit" disabled={loading}
        className="w-full rounded-2xl bg-orange-500 py-3.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60">
        {loading ? "Traitement..." : "Valider et générer le reçu"}
      </button>
    </form>
  );
}

// ─── History ───────────────────────────────────────────────────────────────────
function NatcashHistory() {
  const [filters, setFilters] = useState({ from: today().slice(0, 7) + "-01", to: today(), service_type: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setData(await listNatcash(filters)); } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handlePdf = async (code) => {
    setPdfLoading(code);
    try { await downloadNatcashPdf(code); } catch { /* ignore */ }
    finally { setPdfLoading(null); }
  };

  return (
    <div className="mt-10">
      <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">Historique</p>

      <div className="mb-4 flex flex-wrap gap-3">
        <input type="date" value={filters.from} onChange={(e) => setFilters((p) => ({ ...p, from: e.target.value }))}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400" />
        <input type="date" value={filters.to} onChange={(e) => setFilters((p) => ({ ...p, to: e.target.value }))}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400" />
        <select value={filters.service_type} onChange={(e) => setFilters((p) => ({ ...p, service_type: e.target.value }))}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400">
          <option value="">Tous les types</option>
          <option value="depot">Dépôt</option>
          <option value="retrait">Retrait</option>
          <option value="transfert">Transfert</option>
        </select>
        <button onClick={load} className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
          Filtrer
        </button>
      </div>

      {data && (
        <div className="mb-4 flex gap-6 text-sm">
          <span className="text-slate-500">{data.total} transaction(s)</span>
          <span className="font-semibold">{fmt(data.total_amount)} total</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-3xl bg-white shadow-[0_12px_30px_-18px_rgba(15,23,42,0.12)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {["Code", "Type", "Client", "Téléphone", "Montant", "Traité par", "Date", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Chargement...</td></tr>
            ) : data?.transactions?.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">Aucune transaction</td></tr>
            ) : data?.transactions?.map((tx) => (
              <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{tx.receipt_code}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tx.service_type === "depot" ? "bg-green-100 text-green-700" : tx.service_type === "retrait" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                    {TYPE_LABELS[tx.service_type]}
                  </span>
                </td>
                <td className="px-4 py-3">{tx.client_name}</td>
                <td className="px-4 py-3 font-mono text-xs">{tx.phone_number}</td>
                <td className="px-4 py-3 font-semibold">{fmt(tx.amount)}</td>
                <td className="px-4 py-3 text-slate-500">{tx.processed_by_name}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(tx.created_at).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handlePdf(tx.receipt_code)} disabled={pdfLoading === tx.receipt_code}
                    className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50">
                    {pdfLoading === tx.receipt_code ? "..." : "PDF"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
function Natcash() {
  const user = getStoredUser();
  const canViewHistory = user?.role === "admin" || user?.role === "gestionnaire";
  const [successTx, setSuccessTx] = useState(null);

  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white text-lg font-bold">N</div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Natcash</h1>
          <p className="text-xs text-slate-500">Dépôt · Retrait · Transfert</p>
        </div>
      </div>

      {successTx ? (
        <SuccessPanel transaction={successTx} onNew={() => setSuccessTx(null)} />
      ) : (
        <NatcashForm onSuccess={setSuccessTx} />
      )}

      {canViewHistory && <NatcashHistory />}
    </AppShell>
  );
}

export default Natcash;
