import { useEffect, useState } from "react";

import AppShell from "../components/AppShell";
import MonthlyLineChart from "../components/MonthlyLineChart";
import PaymentBreakdownChart from "../components/PaymentBreakdownChart";
import SaleTable from "../components/SaleTable";
import SalesBarChart from "../components/SalesBarChart";
import StatCard from "../components/StatCard";
import TopSellersTable from "../components/TopSellersTable";
import { getDashboard, viewReceiptPdf } from "../services/saleApi";
import {
  getPermission,
  isPushSupported,
  requestPermission,
  subscribePush,
} from "../services/pushService";
import { getStoredUser } from "../utils/auth";

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} HTG`;

const computeDelta = (current, previous) => {
  if (!previous || previous === 0) return undefined;
  return ((current - previous) / previous) * 100;
};

function KpiCard({ label, value, sub, loading, accent }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:p-5 lg:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <p className={`mt-4 text-3xl font-semibold sm:text-4xl ${accent || "text-slate-950"}`}>
        {loading ? "..." : (value ?? "—")}
      </p>
      {sub ? <p className="mt-2 text-sm text-slate-500">{sub}</p> : null}
    </article>
  );
}

function AlertesStock({ alertes }) {
  return (
    <section className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 sm:mb-6 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
          {alertes.length}
        </span>
        <h3 className="text-sm font-semibold text-amber-900">
          {alertes.length === 1 ? "Alerte stock faible" : "Alertes stock faible"}
        </h3>
      </div>
      <ul className="space-y-2">
        {alertes.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
            <span className="font-medium text-amber-900">{p.nom}</span>
            <span className="text-amber-700">
              {p.quantite_stock} en stock &mdash; seuil&nbsp;:&nbsp;{p.seuil_alerte}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const emptyKpi = {
  ventes_jour: { total: 0, nombre: 0 },
  ventes_semaine: { total: 0, nombre: 0 },
  ventes_mois: { total: 0, nombre: 0 },
  ventes_annee: { total: 0, nombre: 0 },
  prev_semaine: { total: 0, nombre: 0 },
  prev_mois: { total: 0, nombre: 0 },
  benefice_mois: 0,
  stock_total: 0,
  alertes_count: 0,
};

function Dashboard() {
  const user = getStoredUser();
  const isAdmin = user?.role === "admin" || user?.role === "gestionnaire";
  const [kpi, setKpi] = useState(emptyKpi);
  const [alertes, setAlertes] = useState([]);
  const [charts, setCharts] = useState({ chart_7j: [], chart_30j: [], chart_12m: [] });
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pushPermission, setPushPermission] = useState(() =>
    isPushSupported() ? getPermission() : "unsupported"
  );

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setError("");
      setLoading(true);

      try {
        const data = await getDashboard();
        if (!isMounted) return;

        setKpi(data.kpi || emptyKpi);
        setAlertes(data.alertes || []);
        setCharts({
          chart_7j: data.chart_7j || [],
          chart_30j: data.chart_30j || [],
          chart_12m: data.chart_12m || [],
        });
        setPaymentBreakdown(data.payment_breakdown || []);
        setTopSellers(data.top_sellers || []);
        setRecentSales(data.recent_sales || []);
      } catch (requestError) {
        if (!isMounted) return;
        setError(requestError.message || "Chargement impossible.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  // Souscrit automatiquement aux push si la permission est déjà accordée
  useEffect(() => {
    if (!isAdmin || !isPushSupported() || getPermission() !== "granted") return;
    subscribePush().catch(() => {});
  }, [isAdmin]);

  const handleEnablePush = async () => {
    const granted = await requestPermission();
    setPushPermission(granted ? "granted" : "denied");
    if (granted) await subscribePush().catch(() => {});
  };

  const deltaWeek = computeDelta(kpi.ventes_semaine.total, kpi.prev_semaine.total);
  const deltaMonth = computeDelta(kpi.ventes_mois.total, kpi.prev_mois.total);

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

      {/* Invitation à activer les notifications push */}
      {isAdmin && isPushSupported() && pushPermission === "default" && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 sm:mb-6">
          <p className="text-sm text-blue-800">
            Activez les notifications pour être alerté quand le stock est faible.
          </p>
          <button
            type="button"
            onClick={handleEnablePush}
            className="shrink-0 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Activer
          </button>
        </div>
      )}

      {/* Alertes stock faible — admin + gestionnaire */}
      {!loading && isAdmin && alertes.length > 0 && (
        <AlertesStock alertes={alertes} />
      )}

      {/* Hero mobile */}
      <section className="rounded-[28px] bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:p-5 lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Aujourd'hui
        </p>
        <p className="mt-3 text-3xl font-semibold text-slate-950">
          {loading ? "..." : kpi.ventes_jour.nombre}
        </p>
        <p className="mt-2 text-sm text-slate-500">Total vendu</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          {loading ? "..." : formatCurrency(kpi.ventes_jour.total)}
        </p>
      </section>

      {/* KPI cards existants */}
      <section className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Aujourd'hui"
          value={kpi.ventes_jour.nombre}
          revenue={formatCurrency(kpi.ventes_jour.total)}
          loading={loading}
        />
        <StatCard
          label="Cette semaine"
          value={kpi.ventes_semaine.nombre}
          revenue={formatCurrency(kpi.ventes_semaine.total)}
          loading={loading}
          delta={deltaWeek}
          deltaLabel="vs sem. prec."
        />
        <StatCard
          label="Ce mois"
          value={kpi.ventes_mois.nombre}
          revenue={formatCurrency(kpi.ventes_mois.total)}
          loading={loading}
          delta={deltaMonth}
          deltaLabel="vs mois prec."
        />
        <StatCard
          label="Cette annee"
          value={kpi.ventes_annee.nombre}
          revenue={formatCurrency(kpi.ventes_annee.total)}
          loading={loading}
        />
      </section>

      {/* Nouveaux KPI : bénéfice + stock */}
      <section className="mt-3 grid gap-3 sm:gap-4 md:grid-cols-3">
        <KpiCard
          label="Benefice ce mois"
          value={formatCurrency(kpi.benefice_mois)}
          sub="prix vente - prix achat"
          loading={loading}
          accent="text-emerald-700"
        />
        <KpiCard
          label="Produits en stock"
          value={kpi.stock_total}
          sub="quantite totale"
          loading={loading}
        />
        <KpiCard
          label="Alertes stock"
          value={kpi.alertes_count}
          sub="produits sous seuil"
          loading={loading}
          accent={
            !loading && kpi.alertes_count > 0 ? "text-amber-600" : "text-emerald-600"
          }
        />
      </section>

      {/* Graphiques : 7 jours + répartition paiements */}
      <div className="mt-4 grid gap-4 sm:mt-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Tendance recente
          </p>
          <h3 className="text-base font-semibold text-slate-950">Ventes 7 derniers jours</h3>
          <div className="mt-4">
            <SalesBarChart
              data={charts.chart_7j}
              loading={loading}
              emptyMessage="Aucune vente sur les 7 derniers jours."
            />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:p-5">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Paiements
          </p>
          <h3 className="text-base font-semibold text-slate-950">Repartition ce mois</h3>
          <div className="mt-4">
            <PaymentBreakdownChart data={paymentBreakdown} loading={loading} />
          </div>
        </section>
      </div>

      {/* Graphique 30 jours */}
      <section className="mt-4 rounded-3xl bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:mt-6 sm:p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Activite
        </p>
        <h3 className="text-base font-semibold text-slate-950">Ventes 30 derniers jours</h3>
        <div className="mt-4">
          <SalesBarChart
            data={charts.chart_30j}
            loading={loading}
            emptyMessage="Aucune donnee sur les 30 derniers jours."
          />
        </div>
      </section>

      {/* Graphique 12 mois */}
      <section className="mt-4 rounded-3xl bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:mt-6 sm:p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Tendance
        </p>
        <h3 className="text-base font-semibold text-slate-950">CA mensuel sur 12 mois</h3>
        <div className="mt-4">
          <MonthlyLineChart data={charts.chart_12m} loading={loading} />
        </div>
      </section>

      {/* Top vendeurs */}
      <section className="mt-4 rounded-3xl bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:mt-6 sm:p-5 lg:p-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Performance
        </p>
        <h3 className="mb-4 text-base font-semibold text-slate-950">Top vendeurs ce mois</h3>
        <TopSellersTable sellers={topSellers} loading={loading} />
      </section>

      {/* Ventes récentes */}
      <section className="mt-4 rounded-3xl bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:mt-6 sm:p-5 lg:mt-6 lg:p-6">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Activite
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
            Ventes recentes
          </h3>
          <p className="mt-2 text-sm text-slate-500">Les 10 dernieres ventes.</p>
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <SaleTable
          sales={recentSales}
          loading={loading}
          onViewPdf={handleViewPdf}
          onPrint={handlePrint}
        />
      </section>
    </AppShell>
  );
}

export default Dashboard;
