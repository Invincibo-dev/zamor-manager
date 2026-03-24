import { useMemo, useState } from "react";
import { clearSession, getStoredUser } from "../utils/auth";
import {
  createSaleReceiptRequest,
  downloadReceiptPdf,
  printReceiptPdf,
} from "../services/saleApi";

const createEmptyProduct = () => ({
  nom_produit: "",
  quantite: 1,
  prix_unitaire: 0,
});

const formatCurrency = (value) => {
  return `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} HTG`;
};

function SellerHomePage() {
  const user = getStoredUser();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [modePaiement, setModePaiement] = useState("cash");
  const [signatureVendeur, setSignatureVendeur] = useState(user?.name || "");
  const [products, setProducts] = useState([createEmptyProduct()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createdReceipt, setCreatedReceipt] = useState(null);

  const computedProducts = useMemo(() => {
    return products.map((product) => {
      const quantite = Number(product.quantite) || 0;
      const prixUnitaire = Number(product.prix_unitaire) || 0;

      return {
        ...product,
        quantite,
        prix_unitaire: prixUnitaire,
        total: quantite * prixUnitaire,
      };
    });
  }, [products]);

  const totalGeneral = useMemo(() => {
    return computedProducts.reduce((sum, product) => sum + product.total, 0);
  }, [computedProducts]);

  const updateProduct = (index, field, value) => {
    setProducts((current) =>
      current.map((product, currentIndex) =>
        currentIndex === index ? { ...product, [field]: value } : product
      )
    );
  };

  const addProduct = () => {
    setProducts((current) => [...current, createEmptyProduct()]);
  };

  const removeProduct = (index) => {
    setProducts((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const resetForm = () => {
    setDate(new Date().toISOString().slice(0, 16));
    setModePaiement("cash");
    setSignatureVendeur(user?.name || "");
    setProducts([createEmptyProduct()]);
  };

  const handleGenerateReceipt = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const payload = {
        date,
        mode_paiement: modePaiement,
        signature_vendeur: signatureVendeur,
        produits: computedProducts.map((product) => ({
          nom_produit: product.nom_produit.trim(),
          quantite: product.quantite,
          prix_unitaire: product.prix_unitaire,
          total: product.total,
        })),
        total_general: totalGeneral,
      };

      const hasInvalidProduct = payload.produits.some(
        (product) => !product.nom_produit || product.quantite <= 0
      );

      if (hasInvalidProduct) {
        throw new Error("Chaque produit doit avoir un nom et une quantite valide.");
      }

      const data = await createSaleReceiptRequest(payload);

      setCreatedReceipt(data.receipt);
      setMessage(`Fiche créée avec succès. Code : ${data.receipt.code_recu}`);
      resetForm();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#ffffff_38%,#fff7ed_100%)] px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[28px] bg-slate-950 px-6 py-7 text-white shadow-panel sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-orange-300">
                Espace vendeur
              </p>
              <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">
                Nouvelle fiche de vente
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Saisis les produits, vérifie le total automatiquement calculé,
                puis génère la fiche et son reçu PDF.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Connecté
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {user?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearSession();
                  window.location.href = "/login";
                }}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-panel sm:p-8">
            <form onSubmit={handleGenerateReceipt}>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Date
                  </label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Mode de paiement
                  </label>
                  <select
                    value={modePaiement}
                    onChange={(event) => setModePaiement(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  >
                    <option value="cash">Cash</option>
                    <option value="moncash">MonCash</option>
                    <option value="virement">Virement</option>
                    <option value="carte">Carte</option>
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Signature vendeur
                </label>
                <input
                  type="text"
                  value={signatureVendeur}
                  onChange={(event) => setSignatureVendeur(event.target.value)}
                  placeholder="Nom ou signature du vendeur"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Produits</p>
                    <p className="text-sm text-slate-500">
                      Ajoute autant de lignes que nécessaire.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addProduct}
                    className="rounded-2xl bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-800 transition hover:bg-orange-200"
                  >
                    Ajouter produit
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {computedProducts.map((product, index) => (
                    <div
                      key={`product-${index}`}
                      className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-[1.5fr_0.65fr_0.9fr_0.8fr]">
                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                            Produit
                          </label>
                          <input
                            type="text"
                            value={product.nom_produit}
                            onChange={(event) =>
                              updateProduct(index, "nom_produit", event.target.value)
                            }
                            placeholder="Nom du produit"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                            required
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                            Quantité
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={product.quantite}
                            onChange={(event) =>
                              updateProduct(index, "quantite", event.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                            required
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                            Prix unitaire
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={product.prix_unitaire}
                            onChange={(event) =>
                              updateProduct(index, "prix_unitaire", event.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                            required
                          />
                        </div>

                        <div className="flex flex-col justify-between">
                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                              Total
                            </label>
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900">
                              {formatCurrency(product.total)}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProduct(index)}
                            disabled={computedProducts.length === 1}
                            className="mt-3 rounded-2xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {message}
                </div>
              ) : null}

              <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-400">
                  Total général
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-950">
                    {formatCurrency(totalGeneral)}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Génération..." : "Générer fiche"}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-panel">
              <p className="text-sm uppercase tracking-[0.3em] text-brand-700">
                Reçu PDF
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                Actions rapides
              </h2>

              {createdReceipt ? (
                <>
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                      Dernière fiche
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {createdReceipt.code_recu}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Total: {formatCurrency(createdReceipt.total_general)}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => downloadReceiptPdf(createdReceipt.code_recu)}
                      className="rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                    >
                      Télécharger PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => printReceiptPdf(createdReceipt.code_recu)}
                      className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                    >
                      Imprimer
                    </button>
                  </div>
                </>
              ) : (
                <p className="mt-5 text-sm leading-6 text-slate-500">
                  Génère d'abord une fiche de vente pour activer le téléchargement
                  et l'impression du reçu.
                </p>
              )}
            </section>

            <section className="rounded-[28px] border border-orange-100 bg-white p-6 shadow-panel">
              <p className="text-sm uppercase tracking-[0.3em] text-brand-700">
                Résumé
              </p>
              <div className="mt-5 space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Produits saisis</span>
                  <strong className="text-slate-900">{computedProducts.length}</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Mode paiement</span>
                  <strong className="text-slate-900">{modePaiement}</strong>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span>Vendeur</span>
                  <strong className="text-slate-900">{user?.name}</strong>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default SellerHomePage;
