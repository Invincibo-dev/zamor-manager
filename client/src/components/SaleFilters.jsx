import { PAYMENT_MODES } from "../utils/constants";

function SaleFilters({ filters, onChange, onApply, users, loading }) {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <input
        type="date"
        value={filters.startDate}
        onChange={(e) => handleChange("startDate", e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
      <input
        type="date"
        value={filters.endDate}
        onChange={(e) => handleChange("endDate", e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />

      {users && users.length > 0 ? (
        <select
          value={filters.vendeurId || ""}
          onChange={(e) => handleChange("vendeurId", e.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        >
          <option value="">Tous les vendeurs</option>
          {users
            .filter((u) => u.role === "vendeur")
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
        </select>
      ) : null}

      <select
        value={filters.modePaiement || ""}
        onChange={(e) => handleChange("modePaiement", e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      >
        <option value="">Tous les modes</option>
        {PAYMENT_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {mode}
          </option>
        ))}
      </select>

      <input
        type="number"
        min="0"
        placeholder="Montant min (HTG)"
        value={filters.minMontant || ""}
        onChange={(e) => handleChange("minMontant", e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
      <input
        type="number"
        min="0"
        placeholder="Montant max (HTG)"
        value={filters.maxMontant || ""}
        onChange={(e) => handleChange("maxMontant", e.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />

      <input
        type="text"
        placeholder="Rechercher un code recu..."
        value={filters.search || ""}
        onChange={(e) => handleChange("search", e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onApply()}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />

      <button
        type="button"
        onClick={onApply}
        disabled={loading}
        className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        Filtrer
      </button>
    </div>
  );
}

export default SaleFilters;
