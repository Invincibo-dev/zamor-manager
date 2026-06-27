import { useEffect, useMemo, useState } from "react";

import AppShell from "../components/AppShell";
import Pagination from "../components/Pagination";
import SaleFilters from "../components/SaleFilters";
import SaleTable from "../components/SaleTable";
import {
  downloadCsvExport,
  getAdminReport,
  getSalesByDateRange,
  viewReceiptPdf,
} from "../services/saleApi";
import { getUsersRequest } from "../services/userApi";
import { getStoredUser } from "../utils/auth";

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const defaultFilters = {
  startDate: "2026-03-01",
  endDate: getTodayDate(),
  vendeurId: "",
  modePaiement: "",
  minMontant: "",
  maxMontant: "",
  search: "",
};

function Reports() {
  const currentUser = getStoredUser();
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "gestionnaire";

  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({ nombre_ventes: 0, chiffre_affaires_total: 0 });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAdmin) return;

    getUsersRequest()
      .then((data) => setUsers(data.users || []))
      .catch(() => {});
  }, [isAdmin]);

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
          getSalesByDateRange({ ...appliedFilters, page, limit: 20 }),
        ]);

        if (!isMounted) return;

        setSummary({
          nombre_ventes: summaryResponse.nombre_ventes || 0,
          chiffre_affaires_total: summaryResponse.chiffre_affaires_total || 0,
        });
        setSales(salesResponse.sales || []);
        setTotalPages(salesResponse.totalPages || 1);
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.message || "Chargement impossible.");
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [appliedFilters, page]);

  const handleApplyFilters = () => {
    setPage(1);
    setAppliedFilters(filters);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrint = (code) => {
    const printWindow = window.open(`/receipt/print/${encodeURIComponent(code)}`, "_blank");
    if (!printWindow) window.alert("Le navigateur a bloque l'impression.");
  };

  const handleViewPdf = async (code) => {
    try {
      await viewReceiptPdf(code);
    } catch (requestError) {
      window.alert(requestError.message || "Ouverture impossible.");
    }
  };

  const handleExport = async () => {
    if (!appliedFilters.startDate || !appliedFilters.endDate) {
      window.alert("Selectionnez une periode avant d'exporter.");
      return;
    }

    setIsExporting(true);

    try {
      await downloadCsvExport({
        startDate: appliedFilters.startDate,
        endDate: appliedFilters.endDate,
      });
    } catch (requestError) {
      window.alert(requestError.message || "Export impossible.");
    } finally {
      setIsExporting(false);
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
    <AppShell title="Rapports" subtitle="Rapports">
      <section className="rounded-3xl bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:p-5 lg:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Periode
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
              Ventes par date
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Filtre, recherche et exporte tes ventes.
            </p>
          </div>

          {isAdmin ? (
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:opacity-60 lg:w-auto"
            >
              {isExporting ? "Export..." : "Exporter CSV"}
            </button>
          ) : null}
        </div>

        <div className="mt-4">
          <SaleFilters
            filters={filters}
            onChange={setFilters}
            onApply={handleApplyFilters}
            users={isAdmin ? users : null}
            loading={loading}
          />
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Nombre de ventes
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {loading ? "..." : summary.nombre_ventes}
            </p>
          </div>
          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Total vendu
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {loading ? "..." : formattedRevenue} HTG
            </p>
          </div>
        </div>

        <div className="mt-5">
          <SaleTable
            sales={sales}
            loading={loading}
            onViewPdf={handleViewPdf}
            onPrint={handlePrint}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </section>
    </AppShell>
  );
}

export default Reports;
