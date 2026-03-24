import { useEffect, useState } from "react";

import SaleTable from "../components/SaleTable";
import Sidebar from "../components/Sidebar";
import StatCard from "../components/StatCard";
import Topbar from "../components/Topbar";
import {
  getAdminReport,
  getSalesByDateRange,
  viewReceiptPdf,
} from "../services/saleApi";

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} HTG`;

const emptyReport = {
  nombre_ventes: 0,
  chiffre_affaires_total: 0,
};

function Dashboard() {
  const [reports, setReports] = useState({
    daily: emptyReport,
    weekly: emptyReport,
    monthly: emptyReport,
    yearly: emptyReport,
  });
  const [sales, setSales] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setError("");
      setLoadingCards(true);
      setLoadingSales(true);

      try {
        const [daily, weekly, monthly, yearly, salesResponse] = await Promise.all([
          getAdminReport("daily"),
          getAdminReport("weekly"),
          getAdminReport("monthly"),
          getAdminReport("yearly"),
          getSalesByDateRange({}),
        ]);

        if (!isMounted) {
          return;
        }

        setReports({
          daily,
          weekly,
          monthly,
          yearly,
        });
        setSales(salesResponse.sales || []);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(requestError.message || "Impossible de charger le dashboard.");
      } finally {
        if (!isMounted) {
          return;
        }

        setLoadingCards(false);
        setLoadingSales(false);
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = [
    { label: "Ventes aujourd'hui", data: reports.daily },
    { label: "Ventes semaine", data: reports.weekly },
    { label: "Ventes mois", data: reports.monthly },
    { label: "Ventes année", data: reports.yearly },
  ];

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

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title="Dashboard des ventes" subtitle="Dashboard" />

          <section className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {cards.map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.data.nombre_ventes}
                  revenue={formatCurrency(card.data.chiffre_affaires_total)}
                  loading={loadingCards}
                />
              ))}
            </section>

            <section className="mt-8 rounded-xl bg-white p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)]">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Ventes
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                  Liste des ventes
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Données chargées depuis le backend.
                </p>
              </div>

              {error ? (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <SaleTable
                sales={sales}
                loading={loadingSales}
                onViewPdf={handleViewPdf}
                onPrint={handlePrint}
              />
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
