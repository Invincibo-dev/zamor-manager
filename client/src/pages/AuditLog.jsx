import { useCallback, useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import { API_URL } from "../services/authApi";
import { jsonOrThrow } from "../utils/fetchUtils";
import { getStoredUser } from "../utils/auth";

const TABLE_LABELS = {
  debts: "Dettes",
  natcash_transactions: "Natcash",
  recharges: "Recharges",
  sale_receipts: "Ventes",
};

const ACTION_LABELS = {
  create: { label: "Création", cls: "bg-green-100 text-green-800" },
  update: { label: "Modification", cls: "bg-amber-100 text-amber-800" },
  delete: { label: "Suppression", cls: "bg-red-100 text-red-800" },
};

function ActionBadge({ action }) {
  const cfg = ACTION_LABELS[action] ?? { label: action, cls: "bg-slate-100 text-slate-700" };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function JsonBlock({ label, data }) {
  if (data == null) return null;
  let parsed = data;
  if (typeof data === "string") {
    try { parsed = JSON.parse(data); } catch { parsed = data; }
  }
  return (
    <div className="mt-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <pre className="mt-1 max-h-36 overflow-auto rounded-lg bg-slate-50 p-2 text-[11px] text-slate-700">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    </div>
  );
}

const TABLES = ["", "debts", "natcash_transactions", "recharges", "sale_receipts"];
const ACTIONS = ["", "create", "update", "delete"];
const PAGE_SIZE = 50;

export default function AuditLogPage() {
  const user = getStoredUser();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const [filters, setFilters] = useState({
    table_name: "",
    action: "",
    from: "",
    to: "",
  });

  const fetchLogs = useCallback(async (p, f) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: PAGE_SIZE });
      if (f.table_name) params.set("table_name", f.table_name);
      if (f.action) params.set("action", f.action);
      if (f.from) params.set("from", f.from);
      if (f.to) params.set("to", f.to);
      const res = await fetch(`${API_URL}/audit-log?${params}`, { credentials: "include" });
      const data = await jsonOrThrow(res, "Impossible de charger le journal d'audit.");
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(page, filters);
  }, [page, filters, fetchLogs]);

  const handleFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
    setExpanded(null);
  };

  if (user?.role !== "admin") {
    return (
      <AppShell title="Journal d'audit" subtitle="Accès restreint">
        <div className="flex h-64 items-center justify-center text-slate-500">
          Accès réservé aux administrateurs.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Journal d'audit" subtitle="Toutes les opérations sur les données financières — lecture seule.">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">

        {/* Filtres */}
        <div className="mb-4 flex flex-wrap gap-3 pt-4">
          <select
            value={filters.table_name}
            onChange={(e) => handleFilter("table_name", e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">Toutes les tables</option>
            {TABLES.filter(Boolean).map((t) => (
              <option key={t} value={t}>{TABLE_LABELS[t] ?? t}</option>
            ))}
          </select>

          <select
            value={filters.action}
            onChange={(e) => handleFilter("action", e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option value="">Toutes les actions</option>
            {ACTIONS.filter(Boolean).map((a) => (
              <option key={a} value={a}>{ACTION_LABELS[a]?.label ?? a}</option>
            ))}
          </select>

          <input
            type="date"
            value={filters.from}
            onChange={(e) => handleFilter("from", e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Du"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => handleFilter("to", e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="Au"
          />

          {(filters.table_name || filters.action || filters.from || filters.to) && (
            <button
              onClick={() => { setFilters({ table_name: "", action: "", from: "", to: "" }); setPage(1); }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
            >
              Effacer filtres
            </button>
          )}

          <span className="ml-auto self-center text-sm text-slate-500">
            {total} entrée{total !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-slate-400 text-sm">
              Chargement...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-slate-400 text-sm">
              Aucune entrée pour ces critères.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Date / heure</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Table</th>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Modifié par</th>
                    <th className="px-4 py-3">IP</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map((log) => (
                    <>
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                      >
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <ActionBadge action={log.action} />
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {TABLE_LABELS[log.table_name] ?? log.table_name}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">#{log.record_id}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {log.changed_by_name ?? <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-[12px] text-slate-400">
                          {log.ip_address ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {expanded === log.id ? "▲" : "▼"}
                        </td>
                      </tr>

                      {expanded === log.id && (
                        <tr key={`${log.id}-detail`}>
                          <td colSpan={7} className="bg-slate-50 px-6 py-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <JsonBlock label="Avant" data={log.old_values} />
                              <JsonBlock label="Après" data={log.new_values} />
                            </div>
                            {log.old_values == null && log.new_values == null && (
                              <p className="text-xs text-slate-400">Aucun détail disponible.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 disabled:opacity-40"
            >
              Précédent
            </button>
            <span>Page {page} / {pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
