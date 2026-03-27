const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} HTG`;

function SaleTable({ sales, loading, onViewPdf, onPrint }) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        Chargement des ventes...
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        Aucune vente trouvee.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 lg:hidden">
        {sales.map((sale) => (
          <article
            key={sale.id}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                  Code recu
                </p>
                <p className="mt-1 text-base font-semibold text-slate-950">
                  {sale.code_recu}
                </p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-700">
                {sale.mode_paiement}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                  Date
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {new Date(sale.date).toLocaleString("fr-FR")}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                  Vendeur
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {sale.vendeur?.name || "-"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                  Total
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-950">
                  {formatCurrency(sale.total_general)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onViewPdf(sale.code_recu)}
                className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Voir PDF
              </button>
              {onPrint ? (
                <button
                  type="button"
                  onClick={() => onPrint(sale.code_recu)}
                  className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Imprimer
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-3xl border border-slate-200 lg:block">
        <table className="w-full min-w-[920px] border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-4 text-left text-sm font-semibold text-slate-600">
                Code recu
              </th>
              <th className="p-4 text-left text-sm font-semibold text-slate-600">
                Date
              </th>
              <th className="p-4 text-left text-sm font-semibold text-slate-600">
                Vendeur
              </th>
              <th className="p-4 text-right text-sm font-semibold text-slate-600">
                Total
              </th>
              <th className="p-4 text-left text-sm font-semibold text-slate-600">
                Mode paiement
              </th>
              <th className="p-4 text-center text-sm font-semibold text-slate-600">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className="border-t border-slate-200 align-middle">
                <td className="p-4 text-sm font-semibold text-slate-900">
                  {sale.code_recu}
                </td>
                <td className="p-4 text-sm text-slate-700">
                  {new Date(sale.date).toLocaleString("fr-FR")}
                </td>
                <td className="p-4 text-sm text-slate-700">
                  {sale.vendeur?.name || "-"}
                </td>
                <td className="p-4 text-right text-sm font-semibold text-slate-900">
                  {formatCurrency(sale.total_general)}
                </td>
                <td className="p-4 text-sm text-slate-700">{sale.mode_paiement}</td>
                <td className="p-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onViewPdf(sale.code_recu)}
                      className="rounded-xl bg-orange-100 px-3 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-200"
                    >
                      Voir PDF
                    </button>
                    {onPrint ? (
                      <button
                        type="button"
                        onClick={() => onPrint(sale.code_recu)}
                        className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                      >
                        Imprimer
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default SaleTable;
