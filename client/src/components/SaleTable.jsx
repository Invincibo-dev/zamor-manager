function SaleTable({ sales, loading, onViewPdf, onPrint }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full min-w-[920px] border-collapse">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-3 text-left text-sm font-semibold text-slate-600">
              Code reçu
            </th>
            <th className="p-3 text-left text-sm font-semibold text-slate-600">
              Date
            </th>
            <th className="p-3 text-left text-sm font-semibold text-slate-600">
              Vendeur
            </th>
            <th className="p-3 text-right text-sm font-semibold text-slate-600">
              Total
            </th>
            <th className="p-3 text-left text-sm font-semibold text-slate-600">
              Mode paiement
            </th>
            <th className="p-3 text-center text-sm font-semibold text-slate-600">
              Action
            </th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr className="border-t border-gray-200">
              <td colSpan="6" className="px-5 py-8 text-center text-sm text-slate-500">
                Chargement des ventes...
              </td>
            </tr>
          ) : sales.length === 0 ? (
            <tr className="border-t border-gray-200">
              <td colSpan="6" className="px-5 py-8 text-center text-sm text-slate-500">
                Aucune vente trouvée.
              </td>
            </tr>
          ) : (
            sales.map((sale) => (
              <tr key={sale.id} className="border-t border-gray-200 align-middle">
                <td className="p-3 text-sm font-semibold text-slate-900">
                  {sale.code_recu}
                </td>
                <td className="p-3 text-sm text-slate-700">
                  {new Date(sale.date).toLocaleString("fr-FR")}
                </td>
                <td className="p-3 text-sm text-slate-700">
                  {sale.vendeur?.name || "-"}
                </td>
                <td className="p-3 text-right text-sm font-semibold text-slate-900">
                  {Number(sale.total_general).toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  HTG
                </td>
                <td className="p-3 text-sm text-slate-700">{sale.mode_paiement}</td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onViewPdf(sale.code_recu)}
                      className="rounded-lg bg-orange-100 px-3 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-200"
                    >
                      Voir PDF
                    </button>
                    {onPrint ? (
                      <button
                        type="button"
                        onClick={() => onPrint(sale.code_recu)}
                        className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                      >
                        Imprimer
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default SaleTable;
