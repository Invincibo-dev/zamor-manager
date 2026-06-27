import { useCallback, useEffect, useState } from "react";

import AppShell from "../components/AppShell";
import Pagination from "../components/Pagination";
import { getLoginHistory } from "../services/loginHistoryApi";

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const getMonthStart = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

const formatDateTime = (v) =>
  new Date(v).toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const FILTER_OPTIONS = [
  { label: "Toutes", value: "" },
  { label: "Réussies", value: "true" },
  { label: "Échouées", value: "false" },
];

function LoginHistory() {
  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [from, setFrom] = useState(getMonthStart());
  const [to, setTo] = useState(getTodayDate());
  const [successFilter, setSuccessFilter] = useState("");

  const [appliedFrom, setAppliedFrom] = useState(getMonthStart());
  const [appliedTo, setAppliedTo] = useState(getTodayDate());
  const [appliedSuccess, setAppliedSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getLoginHistory({
        from: appliedFrom,
        to: appliedTo,
        success: appliedSuccess,
        page,
        limit: 50,
      });
      setHistory(data.history);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [appliedFrom, appliedTo, appliedSuccess, page]);

  useEffect(() => {
    load();
  }, [load]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFrom(from);
    setAppliedTo(to);
    setAppliedSuccess(successFilter);
  };

  return (
    <AppShell title="Historique connexions" subtitle="Audit des accès">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* Filtres */}
        <div className="rounded-3xl bg-white p-4 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]">
          <div className="flex flex-wrap items-end gap-3">
            {/* Filtre statut */}
            <div className="flex gap-1">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSuccessFilter(opt.value)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    successFilter === opt.value
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Plage de dates */}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-400"
              />
              <span className="text-xs text-slate-400">au</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-400"
              />
              <button
                type="button"
                onClick={applyFilters}
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Filtrer
              </button>
            </div>
          </div>
        </div>

        {/* Résumé */}
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>
            <span className="font-semibold text-slate-900">{total}</span> entrée{total !== 1 ? "s" : ""}
          </span>
        </div>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : null}

        {/* Table desktop */}
        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 lg:block">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Date</th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Email</th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Utilisateur</th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">IP</th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Navigateur</th>
                <th className="p-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Chargement...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Aucune entrée pour cette période.</td>
                </tr>
              ) : (
                history.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTime(entry.created_at)}
                    </td>
                    <td className="p-4 font-medium text-slate-800 break-all">{entry.email}</td>
                    <td className="p-4 text-slate-600">
                      {entry.user ? (
                        <span>
                          {entry.user.name}
                          <span className="ml-1.5 text-[10px] text-slate-400">({entry.user.role})</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">inconnu</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-600">{entry.ip}</td>
                    <td className="p-4 text-xs text-slate-500 max-w-[200px] truncate" title={entry.user_agent}>
                      {entry.user_agent ? shortUA(entry.user_agent) : "—"}
                    </td>
                    <td className="p-4 text-center">
                      {entry.success ? (
                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                          Succès
                        </span>
                      ) : (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-[11px] font-semibold text-red-600">
                          Échec
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Cartes mobile */}
        <div className="space-y-3 lg:hidden">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))
          ) : history.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 px-6 py-10 text-center text-sm text-slate-400">
              Aucune entrée pour cette période.
            </div>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                    {formatDateTime(entry.created_at)}
                  </span>
                  {entry.success ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Succès
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-semibold text-red-600">
                      Échec
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-slate-800 break-all">{entry.email}</p>
                {entry.user ? (
                  <p className="text-xs text-slate-500">
                    {entry.user.name} · {entry.user.role}
                  </p>
                ) : null}
                <p className="font-mono text-xs text-slate-400">{entry.ip}</p>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 ? (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        ) : null}

      </div>
    </AppShell>
  );
}

function shortUA(ua = "") {
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return "Chrome";
  if (/Edg/i.test(ua)) return "Edge";
  if (/Firefox/i.test(ua)) return "Firefox";
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
  if (/MSIE|Trident/i.test(ua)) return "IE";
  if (/curl/i.test(ua)) return "cURL";
  return ua.slice(0, 40);
}

export default LoginHistory;
