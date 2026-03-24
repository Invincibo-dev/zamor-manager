import { useEffect, useMemo, useState } from "react";

import SaleTable from "../components/SaleTable";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  getAdminReport,
  getSalesByDateRange,
  viewReceiptPdf,
} from "../services/saleApi";

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function Reports() {
  const [filters, setFilters] = useState({
    startDate: "2026-03-01",
    endDate: getTodayDate(),
  });
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: "2026-03-01",
    endDate: getTodayDate(),
  });
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({
    nombre_ventes: 0,
    chiffre_affaires_total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      setLoading(true);
      setError("");

      try {
        const queryString = `?startDate=${encodeURIComponent(
          appliedFilters.startDate
        )}&endDate=${encodeURIComponent(appliedFilters.endDate)}`;

        const [summaryResponse, salesResponse] = await Promise.all([
          getAdminReport("custom", queryString),
          getSalesByDateRange(appliedFilters),
        ]);

        if (!isMounted) {
          return;
        }

        setSummary({
          nombre_ventes: summaryResponse.nombre_ventes || 0,
          chiffre_affaires_total: summaryResponse.chiffre_affaires_total || 0,
        });
        setSales(salesResponse.sales || []);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(requestError.message || "Impossible de charger les rapports.");
      } finally {
        if (!isMounted) {
          return;
        }

        setLoading(false);
      }
    };

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [appliedFilters]);

  const handlePrint = (code) => {
    const printWindow = window.open(
      `/receipt/print/${encodeURIComponent(code)}`,
      "_blank"
    );

    if (!printWindow) {
      window.alert("Le navigateur a bloqué la fenêtre d'impression.");
    }
  };

  const handleViewPdf = async (code) => {
    try {
      await viewReceiptPdf(code);
    } catch (requestError) {
      window.alert(requestError.message || "Impossible d'ouvrir le PDF.");
    }
  };

  const formattedRevenue = useMemo(
    () =>
      Number(summary.chiffre_affaires_total).toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [summary]
  );

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title="Rapports personnalisés" subtitle="Rapports" />

          <section className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <section className="rounded-xl bg-white p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                    Rapport personnalisé
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                    Analyse par période
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Données chargées depuis le backend.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        startDate: event.target.value,
                      }))
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }))
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() => setAppliedFilters(filters)}
                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Filtrer
                  </button>
                </div>
              </div>

              {error ? (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Nombre ventes
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {loading ? "..." : summary.nombre_ventes}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-5">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Chiffre d'affaires
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-slate-950">
                    {loading ? "..." : formattedRevenue} HTG
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <SaleTable
                  sales={sales}
                  loading={loading}
                  onViewPdf={handleViewPdf}
                  onPrint={handlePrint}
                />
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Reports;
