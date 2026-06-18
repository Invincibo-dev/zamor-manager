const formatCurrency = (value) =>
  Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " HTG";

function TopSellersTable({ sellers, loading }) {
  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-slate-400">
        Chargement...
      </div>
    );
  }

  if (!sellers || sellers.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-slate-400">
        Aucune vente ce mois.
      </div>
    );
  }

  return (
    <>
      <table className="hidden w-full text-sm lg:table">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Rang
            </th>
            <th className="pb-3 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Vendeur
            </th>
            <th className="pb-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Ventes
            </th>
            <th className="pb-3 text-right text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              CA Total
            </th>
          </tr>
        </thead>
        <tbody>
          {sellers.map((seller, index) => (
            <tr key={seller.vendeur_id || index} className="border-b border-slate-50 last:border-0">
              <td className="py-3 text-slate-400">#{index + 1}</td>
              <td className="py-3 font-medium text-slate-900">
                {seller.vendeur?.name || "—"}
              </td>
              <td className="py-3 text-right text-slate-600">
                {seller.nombre_ventes}
              </td>
              <td className="py-3 text-right font-semibold text-slate-900">
                {formatCurrency(seller.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-col gap-3 lg:hidden">
        {sellers.map((seller, index) => (
          <div
            key={seller.vendeur_id || index}
            className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
              <span className="font-medium text-slate-900">
                {seller.vendeur?.name || "—"}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">{seller.nombre_ventes} ventes</p>
              <p className="text-sm font-semibold text-slate-900">
                {formatCurrency(seller.total)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default TopSellersTable;
