import { useEffect, useState } from "react";

import AppShell from "../components/AppShell";
import SaleTable from "../components/SaleTable";
import StatCard from "../components/StatCard";
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

        setError(requestError.message || "Chargement impossible.");
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
    { label: "Aujourd'hui", data: reports.daily },
    { label: "Cette semaine", data: reports.weekly },
    { label: "Ce mois", data: reports.monthly },
    { label: "Cette annee", data: reports.yearly },
  ];

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
      window.alert(requestError.message || "Ouverture impossible.");
    }
  };

  return (
    <AppShell title="Vue d'ensemble" subtitle="Dashboard">
      <section className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
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

      <section className="mt-5 rounded-3xl bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:mt-6 sm:p-5 lg:mt-8 lg:p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Activite
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
            Ventes recentes
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Les dernieres ventes en un coup d'oeil.
          </p>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
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
    </AppShell>
  );
}

export default Dashboard;
