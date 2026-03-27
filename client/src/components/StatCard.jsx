function StatCard({ label, value, revenue, loading }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:p-5 lg:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
        {label}
      </p>
      <p className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
        {loading ? "..." : value}
      </p>
      <p className="mt-2 text-sm text-slate-500">Chiffre d'affaires</p>
      <p className="mt-1 text-base font-semibold text-slate-800 sm:text-lg">
        {loading ? "..." : revenue}
      </p>
    </article>
  );
}

export default StatCard;
