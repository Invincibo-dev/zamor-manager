import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AppShell from "../components/AppShell";
import {
  createExpense,
  deleteExpense,
  downloadExpensesCsv,
  getFinanceSummary,
  listExpenses,
  updateExpense,
} from "../services/expenseApi";
import { downloadNatcashReportPdf, getNatcashReport } from "../services/natcashApi";
import { downloadRechargesReportPdf, getRechargesReport } from "../services/rechargeApi";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v) =>
  Number(v || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " HTG";

const monthRange = (offsetMonths = 0) => {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const last = new Date(y, d.getMonth() + 1, 0).getDate();
  return { from: `${y}-${m}-01`, to: `${y}-${m}-${last}` };
};

const yearRange = () => {
  const y = new Date().getFullYear();
  return { from: `${y}-01-01`, to: `${y}-12-31` };
};

const PALETTE = [
  "#6366f1", "#0ea5e9", "#f59e0b", "#10b981",
  "#f43f5e", "#8b5cf6", "#14b8a6", "#fb923c",
];

const CATEGORIES = [
  "Loyer / Location",
  "Électricité",
  "Internet / Téléphone",
  "Salaires",
  "Transport",
  "Fournitures",
  "Publicité",
  "Maintenance",
  "Achat stock",
  "Autres",
];

// ─── Expense modal ────────────────────────────────────────────────────────────

function ExpenseModal({ initial, onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    categorie: initial?.categorie ?? CATEGORIES[0],
    montant: initial ? String(initial.montant) : "",
    date_depense: initial?.date_depense ?? today,
    note: initial?.note ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handle = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        categorie: form.categorie,
        montant: Number(form.montant),
        date_depense: form.date_depense,
        note: form.note.trim() || undefined,
      };
      const data = initial
        ? await updateExpense(initial.id, payload)
        : await createExpense(payload);
      onSave(data.expense);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            {initial ? "Modifier dépense" : "Nouvelle dépense"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          ) : null}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Catégorie *
            </label>
            <select
              value={form.categorie}
              onChange={handle("categorie")}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Montant (HTG) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.montant}
                onChange={handle("montant")}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Date *
              </label>
              <input
                type="date"
                value={form.date_depense}
                onChange={handle("date_depense")}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Note
            </label>
            <input
              value={form.note}
              onChange={handle("note")}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Print report ─────────────────────────────────────────────────────────────

function PrintReport({ summary, expenses, periode, onClose }) {
  const ref = useRef(null);

  const print = () => {
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html lang="fr"><head>
      <meta charset="UTF-8" />
      <title>Rapport Finances</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 13px; color: #0f172a; padding: 32px; }
        h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
        .sub { color: #64748b; font-size: 12px; margin-bottom: 24px; }
        .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
        .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
        .card-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: #94a3b8; }
        .card-val { font-size: 18px; font-weight: 700; margin-top: 4px; }
        .pos { color: #10b981; } .neg { color: #f43f5e; }
        h2 { font-size: 13px; font-weight: 700; margin-bottom: 10px; color: #475569; text-transform: uppercase; letter-spacing: 0.1em; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #64748b; padding: 6px 8px; border-bottom: 2px solid #e2e8f0; }
        td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
        tr:last-child td { border-bottom: none; }
        .right { text-align: right; }
        .footer { margin-top: 32px; font-size: 10px; color: #94a3b8; text-align: center; }
      </style>
    </head><body>
      <h1>Rapport Financier</h1>
      <p class="sub">Période : ${periode.from} au ${periode.to}</p>

      <div class="cards">
        <div class="card">
          <div class="card-label">Revenus</div>
          <div class="card-val pos">${fmt(summary.revenus)}</div>
          <div style="font-size:11px;color:#64748b;margin-top:4px">${summary.nb_ventes} vente(s)</div>
        </div>
        <div class="card">
          <div class="card-label">Dépenses</div>
          <div class="card-val neg">${fmt(summary.depenses)}</div>
        </div>
        <div class="card">
          <div class="card-label">Bénéfice net</div>
          <div class="card-val ${summary.benefice >= 0 ? "pos" : "neg"}">${fmt(summary.benefice)}</div>
        </div>
      </div>

      ${summary.depenses_par_categorie.length ? `
      <h2>Dépenses par catégorie</h2>
      <table>
        <thead><tr><th>Catégorie</th><th class="right">Montant</th></tr></thead>
        <tbody>
          ${summary.depenses_par_categorie.map((r) => `
            <tr><td>${r.categorie}</td><td class="right">${fmt(r.total)}</td></tr>
          `).join("")}
        </tbody>
      </table>` : ""}

      ${expenses.length ? `
      <h2>Détail des dépenses</h2>
      <table>
        <thead><tr><th>Date</th><th>Catégorie</th><th>Note</th><th class="right">Montant</th></tr></thead>
        <tbody>
          ${expenses.map((e) => `
            <tr>
              <td>${e.date_depense}</td>
              <td>${e.categorie}</td>
              <td style="color:#64748b">${e.note || "—"}</td>
              <td class="right">${fmt(e.montant)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>` : ""}

      <div class="footer">Généré le ${new Date().toLocaleDateString("fr-FR")} — Zamor Manager</div>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  };

  return (
    <div ref={ref} className="hidden">
      <button onClick={print} />
    </div>
  );
}

// ─── Service Report Component ─────────────────────────────────────────────────

const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function ServiceReport({ title, accentCls, params, setParams, report, loading, pdfLoading, error, onGenerate, onPdf, breakdownLabels, breakdownColors, transactionKey, transactionCols }) {
  const inputCls = "rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl text-white text-xs font-bold ${accentCls}`}>{title[0]}</div>
        <p className="text-base font-semibold text-slate-900">Rapport {title}</p>
      </div>

      {/* Period selector */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Période</label>
          <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1 gap-1">
            {["month", "day"].map((p) => (
              <button key={p} type="button" onClick={() => setParams((prev) => ({ ...prev, period: p }))}
                className={`rounded-xl px-4 py-1.5 text-sm font-semibold transition ${params.period === p ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                {p === "month" ? "Mensuel" : "Journalier"}
              </button>
            ))}
          </div>
        </div>

        {params.period === "day" ? (
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Date</label>
            <input type="date" value={params.date} onChange={(e) => setParams((p) => ({ ...p, date: e.target.value }))} className={inputCls} />
          </div>
        ) : (
          <>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Mois</label>
              <select value={params.month} onChange={(e) => setParams((p) => ({ ...p, month: e.target.value }))} className={inputCls}>
                {MONTHS_FR.map((name, i) => <option key={i + 1} value={String(i + 1)}>{name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Année</label>
              <select value={params.year} onChange={(e) => setParams((p) => ({ ...p, year: e.target.value }))} className={inputCls}>
                {Array.from({ length: 4 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => <option key={y}>{y}</option>)}
              </select>
            </div>
          </>
        )}

        <button type="button" onClick={onGenerate} disabled={loading}
          className="rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
          {loading ? "Génération..." : "Générer le rapport"}
        </button>
      </div>

      {error && <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {report && (
        <>
          {/* Summary */}
          <div className="mb-4 rounded-3xl bg-white p-4 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.15)]">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">Résumé</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">{report.dateLabel}</p>
              </div>
              <button type="button" onClick={onPdf} disabled={pdfLoading || report.total === 0}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50">
                {pdfLoading ? "Génération PDF..." : "Télécharger PDF"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Total</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{report.total}</p>
                <p className="text-[11px] text-slate-500">opération(s)</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Montant total</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{fmt(report.total_amount)}</p>
                <p className="text-[11px] text-slate-500">HTG</p>
              </div>
              {Object.entries(report.breakdown || {}).map(([key, stats]) => (
                <div key={key} className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{breakdownLabels[key] || key}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{stats.count}</p>
                  <p className="text-[11px] text-slate-500">{fmt(stats.amount)} HTG</p>
                </div>
              ))}
            </div>

            {report.total === 0 && (
              <p className="mt-3 text-center text-sm text-slate-400">Aucune transaction pour cette période.</p>
            )}
          </div>

          {/* Transactions table */}
          {(report[transactionKey] || []).length > 0 && (
            <div className="overflow-hidden rounded-3xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {transactionCols.map((col) => (
                      <th key={col.label} className={`p-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 ${col.right ? "text-right" : "text-left"}`}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(report[transactionKey] || []).map((item, i) => (
                    <tr key={item.id || i} className="hover:bg-slate-50/60">
                      {transactionCols.map((col) => (
                        <td key={col.label} className={`p-3 ${col.right ? "text-right" : ""}`}>{col.render(item)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const PRESETS = [
  { label: "Ce mois", range: () => monthRange(0) },
  { label: "Mois précédent", range: () => monthRange(-1) },
  { label: "Cette année", range: yearRange },
];

function Finances() {
  const [periode, setPeriode] = useState(() => monthRange(0));
  const [customFrom, setCustomFrom] = useState(periode.from);
  const [customTo, setCustomTo] = useState(periode.to);
  const [activePreset, setActivePreset] = useState(0);
  const [tab, setTab] = useState("resume");

  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | "create" | { expense }
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef(null);

  const _thisMonth = String(new Date().getMonth() + 1);
  const _thisYear = String(new Date().getFullYear());
  const _today = new Date().toISOString().slice(0, 10);

  const [natParams, setNatParams] = useState({ period: "month", date: _today, month: _thisMonth, year: _thisYear });
  const [natReport, setNatReport] = useState(null);
  const [natLoading, setNatLoading] = useState(false);
  const [natPdfLoading, setNatPdfLoading] = useState(false);
  const [natError, setNatError] = useState("");

  const [rchParams, setRchParams] = useState({ period: "month", date: _today, month: _thisMonth, year: _thisYear });
  const [rchReport, setRchReport] = useState(null);
  const [rchLoading, setRchLoading] = useState(false);
  const [rchPdfLoading, setRchPdfLoading] = useState(false);
  const [rchError, setRchError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    setError("");
    try {
      const data = await getFinanceSummary(periode);
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSummary(false);
    }
  }, [periode]);

  const loadExpenses = useCallback(async () => {
    setLoadingExpenses(true);
    try {
      const data = await listExpenses({ from: periode.from, to: periode.to, limit: 200 });
      setExpenses(data.expenses);
    } catch {
      // non-blocking
    } finally {
      setLoadingExpenses(false);
    }
  }, [periode]);

  useEffect(() => {
    loadSummary();
    loadExpenses();
  }, [loadSummary, loadExpenses]);

  const applyPreset = (idx) => {
    const range = PRESETS[idx].range();
    setActivePreset(idx);
    setCustomFrom(range.from);
    setCustomTo(range.to);
    setPeriode(range);
  };

  const applyCustom = () => {
    if (customFrom && customTo && customFrom <= customTo) {
      setActivePreset(-1);
      setPeriode({ from: customFrom, to: customTo });
    }
  };

  const handleSaved = (expense) => {
    setExpenses((prev) => {
      const idx = prev.findIndex((e) => e.id === expense.id);
      const next =
        idx >= 0
          ? prev.map((e) => (e.id === expense.id ? expense : e))
          : [expense, ...prev];
      return next.sort((a, b) => b.date_depense.localeCompare(a.date_depense));
    });
    setModal(null);
    loadSummary();
  };

  const handleDelete = async (expense) => {
    if (!window.confirm(`Supprimer cette dépense de ${fmt(expense.montant)} ?`)) return;
    try {
      await deleteExpense(expense.id);
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
      loadSummary();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePrint = () => {
    if (!summary) return;
    printRef.current?.querySelector("button")?.click();
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await downloadExpensesCsv({ from: periode.from, to: periode.to });
    } catch (err) {
      alert(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const beneficePositif = summary ? summary.benefice >= 0 : true;

  return (
    <AppShell title="Finances" subtitle="Revenus, dépenses et bénéfice">
      <div className="mx-auto max-w-4xl space-y-5">

        {/* Period selector */}
        <div className="rounded-3xl bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]">
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((p, i) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(i)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  activePreset === i
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-400"
              />
              <span className="text-xs text-slate-400">au</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-400"
              />
              <button
                type="button"
                onClick={applyCustom}
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : null}

        {/* Summary cards */}
        {loadingSummary ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-3xl bg-slate-100" />
            ))}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-3xl bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-emerald-600">
                Revenus
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
                {fmt(summary.revenus)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {summary.nb_ventes} vente{summary.nb_ventes > 1 ? "s" : ""}
              </p>
            </div>
            <div className="rounded-3xl bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-600">
                Dépenses
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
                {fmt(summary.depenses)}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {expenses.length} entrée{expenses.length > 1 ? "s" : ""}
              </p>
            </div>
            <div
              className={`rounded-3xl p-4 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)] ${
                beneficePositif ? "bg-emerald-50" : "bg-rose-50"
              }`}
            >
              <p
                className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${
                  beneficePositif ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                Bénéfice net
              </p>
              <p
                className={`mt-2 text-xl font-semibold sm:text-2xl ${
                  beneficePositif ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {fmt(summary.benefice)}
              </p>
            </div>
          </div>
        ) : null}

        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
          {[
            { key: "resume", label: "Résumé" },
            { key: "depenses", label: "Dépenses" },
            { key: "services", label: "Services" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                tab === t.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Résumé tab */}
        {tab === "resume" ? (
          <div className="space-y-4">
            {summary?.depenses_par_categorie?.length > 0 ? (
              <div className="rounded-3xl bg-white p-5 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Dépenses par catégorie
                  </p>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Imprimer / PDF
                  </button>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={summary.depenses_par_categorie}
                    margin={{ top: 4, right: 4, left: 4, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="categorie"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                    />
                    <Tooltip
                      formatter={(v) => [fmt(v), "Montant"]}
                      contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {summary.depenses_par_categorie.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              !loadingSummary && (
                <div className="rounded-3xl bg-slate-50 px-6 py-10 text-center">
                  <p className="text-sm text-slate-400">
                    Aucune dépense pour cette période.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setTab("depenses");
                      setModal("create");
                    }}
                    className="mt-4 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
                  >
                    Ajouter une dépense
                  </button>
                </div>
              )
            )}
          </div>
        ) : null}

        {/* Services tab */}
        {tab === "services" ? (
          <div className="space-y-8">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Les services (Natcash + Recharges) sont des services clients — ils ne sont pas inclus dans le calcul du bénéfice.
            </div>

            {/* ── Rapport Natcash ── */}
            <ServiceReport
              title="Natcash"
              accentCls="bg-orange-500"
              params={natParams}
              setParams={setNatParams}
              report={natReport}
              loading={natLoading}
              pdfLoading={natPdfLoading}
              error={natError}
              onGenerate={async () => {
                setNatLoading(true); setNatError(""); setNatReport(null);
                try { setNatReport(await getNatcashReport(natParams)); }
                catch (e) { setNatError(e.message); }
                finally { setNatLoading(false); }
              }}
              onPdf={async () => {
                setNatPdfLoading(true); setNatError("");
                try { await downloadNatcashReportPdf(natParams); }
                catch (e) { setNatError(e.message); }
                finally { setNatPdfLoading(false); }
              }}
              breakdownLabels={{ depot: "Dépôt", retrait: "Retrait", transfert: "Transfert" }}
              breakdownColors={{ depot: "bg-green-100 text-green-700", retrait: "bg-red-100 text-red-700", transfert: "bg-blue-100 text-blue-700" }}
              transactionKey="transactions"
              transactionCols={[
                { label: "Date / Heure", render: (tx) => new Date(tx.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
                { label: "Client", render: (tx) => tx.client_name },
                { label: "Téléphone", render: (tx) => <span className="font-mono text-xs">{tx.phone_number}</span> },
                { label: "Type", render: (tx) => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${{ depot: "bg-green-100 text-green-700", retrait: "bg-red-100 text-red-700", transfert: "bg-blue-100 text-blue-700" }[tx.service_type]}`}>{{ depot: "Dépôt", retrait: "Retrait", transfert: "Transfert" }[tx.service_type]}</span> },
                { label: "Montant", render: (tx) => <span className="font-semibold">{fmt(tx.amount)}</span>, right: true },
                { label: "Employé", render: (tx) => <span className="text-slate-500">{tx.processed_by_name}</span> },
              ]}
            />

            <div className="border-t border-slate-100" />

            {/* ── Rapport Recharges ── */}
            <ServiceReport
              title="Recharges"
              accentCls="bg-blue-600"
              params={rchParams}
              setParams={setRchParams}
              report={rchReport}
              loading={rchLoading}
              pdfLoading={rchPdfLoading}
              error={rchError}
              onGenerate={async () => {
                setRchLoading(true); setRchError(""); setRchReport(null);
                try { setRchReport(await getRechargesReport(rchParams)); }
                catch (e) { setRchError(e.message); }
                finally { setRchLoading(false); }
              }}
              onPdf={async () => {
                setRchPdfLoading(true); setRchError("");
                try { await downloadRechargesReportPdf(rchParams); }
                catch (e) { setRchError(e.message); }
                finally { setRchPdfLoading(false); }
              }}
              breakdownLabels={{ natcom: "Natcom", digicel: "Digicel" }}
              breakdownColors={{ natcom: "bg-blue-100 text-blue-700", digicel: "bg-red-100 text-red-700" }}
              transactionKey="recharges"
              transactionCols={[
                { label: "Date / Heure", render: (rc) => new Date(rc.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
                { label: "Compagnie", render: (rc) => <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${{ natcom: "bg-blue-100 text-blue-700", digicel: "bg-red-100 text-red-700" }[rc.company]}`}>{{ natcom: "Natcom", digicel: "Digicel" }[rc.company]}</span> },
                { label: "Numéro", render: (rc) => <span className="font-mono text-xs">{rc.phone_number}</span> },
                { label: "Montant", render: (rc) => <span className="font-semibold">{fmt(rc.amount)}</span>, right: true },
                { label: "Employé", render: (rc) => <span className="text-slate-500">{rc.processed_by_name}</span> },
              ]}
            />
          </div>
        ) : null}

        {/* Dépenses tab */}
        {tab === "depenses" ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={isExporting}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {isExporting ? "Export..." : "Exporter CSV"}
              </button>
              <button
                type="button"
                onClick={() => setModal("create")}
                className="rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                + Nouvelle dépense
              </button>
            </div>

            {loadingExpenses ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 px-6 py-10 text-center">
                <p className="text-sm text-slate-400">Aucune dépense pour cette période.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Date
                      </th>
                      <th className="p-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Catégorie
                      </th>
                      <th className="hidden p-3 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 sm:table-cell">
                        Note
                      </th>
                      <th className="p-3 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        Montant
                      </th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/60">
                        <td className="p-3 text-slate-500">{e.date_depense}</td>
                        <td className="p-3 font-medium text-slate-900">{e.categorie}</td>
                        <td className="hidden p-3 text-slate-400 sm:table-cell">
                          {e.note || "—"}
                        </td>
                        <td className="p-3 text-right font-semibold text-slate-950">
                          {fmt(e.montant)}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setModal({ expense: e })}
                              className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(e)}
                              className="rounded-xl px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
                            >
                              Suppr.
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {modal === "create" ? (
        <ExpenseModal onSave={handleSaved} onClose={() => setModal(null)} />
      ) : modal?.expense ? (
        <ExpenseModal
          initial={modal.expense}
          onSave={handleSaved}
          onClose={() => setModal(null)}
        />
      ) : null}

      {/* Hidden print trigger */}
      {summary ? (
        <div ref={printRef} className="hidden">
          <PrintReport
            summary={summary}
            expenses={expenses}
            periode={periode}
            onClose={() => {}}
          />
        </div>
      ) : null}
    </AppShell>
  );
}

export default Finances;
