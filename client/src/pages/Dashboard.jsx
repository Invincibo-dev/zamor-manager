import { useEffect, useState } from "react";

import AppShell from "../components/AppShell";
import MonthlyLineChart from "../components/MonthlyLineChart";
import PaymentBreakdownChart from "../components/PaymentBreakdownChart";
import SaleTable from "../components/SaleTable";
import SalesBarChart from "../components/SalesBarChart";
import StatCard from "../components/StatCard";
import TopSellersTable from "../components/TopSellersTable";
import {
  getAdminReport,
  getDashboardChartData,
  getPaymentBreakdown,
  getSalesByDateRange,
  getTopSellers,
  viewReceiptPdf,
} from "../services/saleApi";

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} HTG`;

const emptyReport = { nombre_ventes: 0, chiffre_affaires_total: 0 };

const computeDelta = (current, previous) => {
  if (!previous || previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
};

const getWeekRange = (offsetWeeks = 0) => {
  const now = new Date();
  const currentDay = now.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + offsetWeeks * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    startDate: monday.toISOString().slice(0, 10),
    endDate: sunday.toISOString().slice(0, 10),
  };
};

const getMonthRange = (offsetMonths = 0) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offsetMonths;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};

function Dashboard() {
  const [reports, setReports] = useState({
    daily: emptyReport,
    weekly: emptyReport,
    monthly: emptyReport,
    yearly: emptyReport,
    prevWeekly: emptyReport,
    prevMonthly: emptyReport,
  });
  const [sales, setSales] = useState([]);
  const [chartData, setChartData] = useState({ daily: [], monthly: [] });
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingSales, setLoadingSales] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setError("");
      setLoadingCards(true);
      setLoadingSales(true);
      setLoadingCharts(true);

      const thisWeek = getWeekRange(0);
      const prevWeek = getWeekRange(-1);
      const thisMonth = getMonthRange(0);
      const prevMonth = getMonthRange(-1);

      try {
        const [
          daily,
          weekly,
          monthly,
          yearly,
          prevWeekly,
          prevMonthly,
          salesResponse,
          charts,
          breakdown,
          sellers,
        ] = await Promise.all([
          getAdminReport("daily"),
          getAdminReport("weekly"),
          getAdminReport("monthly"),
          getAdminReport("yearly"),
          getAdminReport("custom", `?startDate=${prevWeek.startDate}&endDate=${prevWeek.endDate}`),
          getAdminReport("custom", `?startDate=${prevMonth.startDate}&endDate=${prevMonth.endDate}`),
          getSalesByDateRange({ limit: 10 }),
          getDashboardChartData(),
          getPaymentBreakdown(thisMonth),
          getTopSellers(thisMonth),
        ]);

        if (!isMounted) return;

        setReports({ daily, weekly, monthly, yearly, prevWeekly, prevMonthly });
        setSales(salesResponse.sales || []);
        setChartData({ daily: charts.daily || [], monthly: charts.monthly || [] });
        setPaymentBreakdown(breakdown.breakdown || []);
        setTopSellers(sellers.sellers || []);
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.message || "Chargement impossible.");
      } finally {
        if (!isMounted) return;
        setLoadingCards(false);
        setLoadingSales(false);
        setLoadingCharts(false);
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const deltaWeek = computeDelta(
    reports.weekly.chiffre_affaires_total,
    reports.prevWeekly.chiffre_affaires_total
  );
  const deltaMonth = computeDelta(
    reports.monthly.chiffre_affaires_total,
    reports.prevMonthly.chiffre_affaires_total
  );

  const cards = [
    { label: "Aujourd'hui", data: reports.daily },
    { label: "Cette semaine", data: reports.weekly, delta: deltaWeek, deltaLabel: "vs sem. prec." },
    { label: "Ce mois", data: reports.monthly, delta: deltaMonth, deltaLabel: "vs mois prec." },
    { label: "Cette annee", data: reports.yearly },
  ];

  const handlePrint = (code) => {
    const printWindow = window.open(`/receipt/print/${encodeURIComponent(code)}`, "_blank");
    if (!printWindow) window.alert("Le navigateur a bloque la fenetre d'impression.");
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
      <section className="rounded-[28px] bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:p-5 lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Aujourd'hui
        </p>
        <p className="mt-3 text-3xl font-semibold text-slate-950">
          {loadingCards ? "..." : reports.daily.nombre_ventes}
        </p>
        <p className="mt-2 text-sm text-slate-500">Total vendu</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {loadingCards ? "..." : formatCurrency(reports.daily.chiffre_affaires_total)}
        </p>
      </section>

      <section className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.data.nombre_ventes}
            revenue={formatCurrency(card.data.chiffre_affaires_total)}
            loading={loadingCards}
            delta={card.delta}
            deltaLabel={card.deltaLabel}
          />
        ))}
      </section>

      <div className="mt-4 grid gap-4 sm:mt-6 lg:mt-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Activite
          </p>
          <h3 className="text-base font-semibold text-slate-950">Ventes 30 derniers jours</h3>
          <div className="mt-4">
            <SalesBarChart data={chartData.daily} loading={loadingCharts} />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Paiements
          </p>
          <h3 className="text-base font-semibold text-slate-950">Repartition ce mois</h3>
          <div className="mt-4">
            <PaymentBreakdownChart data={paymentBreakdown} loading={loadingCharts} />
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:mt-6 sm:p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Tendance
        </p>
        <h3 className="text-base font-semibold text-slate-950">CA mensuel sur 12 mois</h3>
        <div className="mt-4">
          <MonthlyLineChart data={chartData.monthly} loading={loadingCharts} />
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:mt-6 sm:p-5 lg:p-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Performance
        </p>
        <h3 className="mb-4 text-base font-semibold text-slate-950">Top vendeurs ce mois</h3>
        <TopSellersTable sellers={topSellers} loading={loadingCharts} />
      </section>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:mt-6 sm:p-5 lg:mt-6 lg:p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Activite
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
            Ventes recentes
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Les 10 dernieres ventes.
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
