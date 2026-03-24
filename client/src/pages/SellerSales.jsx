import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { getSalesByDateRange, viewReceiptPdf } from "../services/saleApi";

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} HTG`;

const getToday = () => new Date().toISOString().slice(0, 10);
const getMonthStart = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
};

function SellerSales() {
  const [filters, setFilters] = useState({
    startDate: getMonthStart(),
    endDate: getToday(),
  });
  const [appliedFilters, setAppliedFilters] = useState({
    startDate: getMonthStart(),
    endDate: getToday(),
  });
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSales = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getSalesByDateRange(appliedFilters);

        if (!isMounted) {
          return;
        }

        setSales(data.sales || []);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(requestError.message || "Impossible de charger l'historique.");
      } finally {
        if (!isMounted) {
          return;
        }

        setLoading(false);
      }
    };

    loadSales();

    return () => {
      isMounted = false;
    };
  }, [appliedFilters]);

  const summary = useMemo(() => {
    const totalCount = sales.length;
    const totalAmount = sales.reduce(
      (sum, sale) => sum + Number(sale.total_general || 0),
      0
    );

    return {
      totalCount,
      totalAmount,
    };
  }, [sales]);

  const handlePrint = (code) => {
    const printWindow = window.open(
      `/receipt/print/${encodeURIComponent(code)}`,
      "_blank"
    );

    if (!printWindow) {
      window.alert("Le navigateur a bloque la fenetre d'impression.");
    }
  };

  const handleViewPdf = async (code) => {
    try {
      await viewReceiptPdf(code);
    } catch (requestError) {
      window.alert(requestError.message || "Impossible d'ouvrir le PDF.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title="Historique des ventes" subtitle="Mes ventes" />

          <section className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.32)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
                      Historique
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-950">
                      Rechercher mes fiches enregistrees
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Filtre par periode puis ouvre le PDF ou relance une impression ticket.
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
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setAppliedFilters(filters)}
                      className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Filtrer
                    </button>
                  </div>
                </div>

                {error ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      Nombre de ventes
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">
                      {loading ? "..." : summary.totalCount}
                    </p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                      Total realise
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">
                      {loading ? "..." : formatCurrency(summary.totalAmount)}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.32)]">
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[920px] border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-4 text-left text-sm font-semibold text-slate-600">
                          Code recu
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-slate-600">
                          Date
                        </th>
                        <th className="p-4 text-right text-sm font-semibold text-slate-600">
                          Total
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-slate-600">
                          Mode paiement
                        </th>
                        <th className="p-4 text-center text-sm font-semibold text-slate-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr className="border-t border-slate-200">
                          <td
                            colSpan="5"
                            className="px-5 py-8 text-center text-sm text-slate-500"
                          >
                            Chargement des ventes...
                          </td>
                        </tr>
                      ) : sales.length === 0 ? (
                        <tr className="border-t border-slate-200">
                          <td
                            colSpan="5"
                            className="px-5 py-8 text-center text-sm text-slate-500"
                          >
                            Aucune vente trouvee.
                          </td>
                        </tr>
                      ) : (
                        sales.map((sale) => (
                          <tr key={sale.id} className="border-t border-slate-200">
                            <td className="p-4 text-sm font-semibold text-slate-900">
                              {sale.code_recu}
                            </td>
                            <td className="p-4 text-sm text-slate-700">
                              {new Date(sale.date).toLocaleString("fr-FR")}
                            </td>
                            <td className="p-4 text-right text-sm font-semibold text-slate-900">
                              {formatCurrency(sale.total_general)}
                            </td>
                            <td className="p-4 text-sm text-slate-700">
                              {sale.mode_paiement}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleViewPdf(sale.code_recu)}
                                  className="rounded-xl bg-orange-100 px-3 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-200"
                                >
                                  Voir PDF
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePrint(sale.code_recu)}
                                  className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                                >
                                  Imprimer
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-4 lg:hidden">
                  {loading ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      Chargement des ventes...
                    </div>
                  ) : sales.length === 0 ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      Aucune vente trouvee.
                    </div>
                  ) : (
                    sales.map((sale) => (
                      <article
                        key={sale.id}
                        className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                              Code
                            </p>
                            <p className="mt-1 text-base font-semibold text-slate-950">
                              {sale.code_recu}
                            </p>
                          </div>
                          <p className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                            {sale.mode_paiement}
                          </p>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                              Date
                            </p>
                            <p className="mt-1 text-sm text-slate-700">
                              {new Date(sale.date).toLocaleString("fr-FR")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                              Total
                            </p>
                            <p className="mt-1 text-base font-semibold text-slate-950">
                              {formatCurrency(sale.total_general)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => handleViewPdf(sale.code_recu)}
                            className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                          >
                            Voir PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrint(sale.code_recu)}
                            className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            Imprimer
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default SellerSales;
