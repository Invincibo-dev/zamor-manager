import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { createRecharge, listRecharges, downloadRechargePdf } from "../services/rechargeApi";
import { getStoredUser } from "../utils/auth";

const fmt = (v) =>
  Number(v || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " HTG";

const today = () => new Date().toISOString().slice(0, 10);

// ─── Company selector ──────────────────────────────────────────────────────────
function CompanySelector({ value, onChange }) {
  const options = [
    { id: "natcom", label: "Natcom", color: "bg-blue-600", ring: "ring-blue-500", text: "text-white" },
    { id: "digicel", label: "Digicel", color: "bg-red-600", ring: "ring-red-500", text: "text-white" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((o) => (
        <button key={o.id} type="button" onClick={() => onChange(o.id)}
          className={`rounded-2xl py-4 text-sm font-bold transition ${o.color} ${o.text} ${value === o.id ? `ring-2 ring-offset-2 ${o.ring} scale-[1.03]` : "opacity-60 hover:opacity-90"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Success panel ─────────────────────────────────────────────────────────────
function SuccessPanel({ recharge, onNew }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const companyLabel = recharge.company === "natcom" ? "Natcom" : "Digicel";

  const handlePdf = async () => {
    setPdfLoading(true);
    try { await downloadRechargePdf(recharge.receipt_code); }
    catch (e) { alert(e.message); }
    finally { setPdfLoading(false); }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-green-200 bg-green-50 p-6 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white text-2xl">✓</div>
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-green-700 mb-1">Recharge effectuée</p>
      <p className="text-2xl font-bold text-green-900 mb-4">{recharge.receipt_code}</p>
      <div className="rounded-2xl bg-white p-4 text-left space-y-2 text-sm mb-4">
        <div className="flex justify-between"><span className="text-slate-500">Compagnie</span><span className="font-semibold">{companyLabel}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Numéro</span><span className="font-mono font-semibold">{recharge.phone_number}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Montant</span><span className="font-bold text-green-700">{fmt(recharge.amount)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Traité par</span><span className="font-semibold">{recharge.processed_by_name}</span></div>
      </div>
      <div className="flex gap-3">
        <button onClick={handlePdf} disabled={pdfLoading}
          className="flex-1 rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
          {pdfLoading ? "Chargement..." : "Télécharger PDF"}
        </button>
        <button onClick={onNew}
          className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          Nouvelle recharge
        </button>
      </div>
    </div>
  );
}

// ─── Form ──────────────────────────────────────────────────────────────────────
function RechargeForm({ onSuccess }) {
  const [form, setForm] = useState({ company: "natcom", phone_number: "", amount: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await createRecharge({ ...form, amount: Number(form.amount) });
      onSuccess(data.recharge);
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
      <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">Nouvelle recharge</p>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div>
        <label className={labelCls}>Compagnie *</label>
        <CompanySelector value={form.company} onChange={(v) => setForm((p) => ({ ...p, company: v }))} />
      </div>

      <div>
        <label className={labelCls}>Numéro à recharger *</label>
        <input type="tel" value={form.phone_number} onChange={handle("phone_number")} required placeholder="Ex: 50936789012" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Montant (HTG) *</label>
        <input type="number" min="1" step="0.01" value={form.amount} onChange={handle("amount")} required placeholder="Ex: 1000" className={inputCls} />
      </div>

      <button type="submit" disabled={loading}
        className={`w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition disabled:opacity-60 ${form.company === "natcom" ? "bg-blue-600 hover:bg-blue-700" : "bg-red-600 hover:bg-red-700"}`}>
        {loading ? "Traitement..." : "Recharger et générer le reçu"}
      </button>
    </form>
  );
}

// ─── History ───────────────────────────────────────────────────────────────────
function RechargesHistory() {
  const [filters, setFilters] = useState({ from: today().slice(0, 7) + "-01", to: today(), company: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(null);

  const load = async () => {
    setLoading(true);
    try { setData(await listRecharges(filters)); } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handlePdf = async (code) => {
    setPdfLoading(code);
    try { await downloadRechargePdf(code); } catch { /* ignore */ }
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
        <select value={filters.company} onChange={(e) => setFilters((p) => ({ ...p, company: e.target.value }))}
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-blue-400">
          <option value="">Toutes les compagnies</option>
          <option value="natcom">Natcom</option>
          <option value="digicel">Digicel</option>
        </select>
        <button onClick={load} className="rounded-2xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
          Filtrer
        </button>
      </div>

      {data && (
        <div className="mb-4 flex gap-6 text-sm">
          <span className="text-slate-500">{data.total} recharge(s)</span>
          <span className="font-semibold">{fmt(data.total_amount)} total</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-3xl bg-white shadow-[0_12px_30px_-18px_rgba(15,23,42,0.12)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {["Code", "Compagnie", "Numéro", "Montant", "Traité par", "Date", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Chargement...</td></tr>
            ) : data?.recharges?.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Aucune recharge</td></tr>
            ) : data?.recharges?.map((rc) => (
              <tr key={rc.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-mono text-xs">{rc.receipt_code}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${rc.company === "natcom" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                    {rc.company === "natcom" ? "Natcom" : "Digicel"}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{rc.phone_number}</td>
                <td className="px-4 py-3 font-semibold">{fmt(rc.amount)}</td>
                <td className="px-4 py-3 text-slate-500">{rc.processed_by_name}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(rc.created_at).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handlePdf(rc.receipt_code)} disabled={pdfLoading === rc.receipt_code}
                    className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50">
                    {pdfLoading === rc.receipt_code ? "..." : "PDF"}
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
function Recharges() {
  const user = getStoredUser();
  const canViewHistory = user?.role === "admin" || user?.role === "gestionnaire";
  const [successRc, setSuccessRc] = useState(null);

  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white text-lg font-bold">R</div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Recharges Minutes</h1>
          <p className="text-xs text-slate-500">Natcom · Digicel</p>
        </div>
      </div>

      {successRc ? (
        <SuccessPanel recharge={successRc} onNew={() => setSuccessRc(null)} />
      ) : (
        <RechargeForm onSuccess={setSuccessRc} />
      )}

      {canViewHistory && <RechargesHistory />}
    </AppShell>
  );
}

export default Recharges;
