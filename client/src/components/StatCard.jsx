function StatCard({ label, value, revenue, loading }) {
  return (
    <article className="rounded-xl bg-white p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)]">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
        {label}
      </p>
      <p className="mt-5 text-4xl font-semibold text-slate-950">
        {loading ? "..." : value}
      </p>
      <p className="mt-3 text-sm text-slate-500">Chiffre d'affaires</p>
      <p className="mt-1 text-lg font-semibold text-slate-800">
        {loading ? "..." : revenue}
      </p>
    </article>
  );
}

export default StatCard;
