import { useMemo, useRef, useState } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  createSaleReceiptRequest,
  downloadReceiptPdf,
} from "../services/saleApi";
import { getStoredUser } from "../utils/auth";

const createRow = () => ({ product: "", qty: 1, price: 0 });
const createSaleSessionId = () => crypto.randomUUID();
const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} HTG`;

function CreateSale() {
  const user = getStoredUser();
  const isSeller = user?.role === "vendeur";
  const [rows, setRows] = useState([createRow()]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [saleSessionId, setSaleSessionId] = useState(createSaleSessionId);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createdReceipt, setCreatedReceipt] = useState(null);
  const savePromiseRef = useRef(null);

  const markAsDirty = () => {
    if (saved) {
      setSaleSessionId(createSaleSessionId());
    }

    setSaved(false);
    setCreatedReceipt(null);
  };

  const handleChange = (index, field, value) => {
    markAsDirty();
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  };

  const addRow = () => {
    markAsDirty();
    setRows((currentRows) => [...currentRows, createRow()]);
  };

  const removeRow = (index) => {
    markAsDirty();
    setRows((currentRows) => {
      const nextRows = currentRows.filter((_, rowIndex) => rowIndex !== index);
      return nextRows.length ? nextRows : [createRow()];
    });
  };

  const lineItems = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        qty: Number(row.qty) || 0,
        price: Number(row.price) || 0,
        total: (Number(row.qty) || 0) * (Number(row.price) || 0),
      })),
    [rows]
  );

  const validItems = useMemo(
    () =>
      lineItems
        .filter((row) => row.product.trim())
        .map((row) => ({
          nom_produit: row.product.trim(),
          quantite: row.qty,
          prix_unitaire: row.price,
        }))
        .filter((item) => item.quantite > 0 && item.prix_unitaire >= 0),
    [lineItems]
  );

  const totalGeneral = useMemo(
    () => lineItems.reduce((sum, row) => sum + row.total, 0),
    [lineItems]
  );

  async function saveSaleIfNotSaved() {
    if (saved && createdReceipt?.code_recu) {
      return createdReceipt;
    }

    if (savePromiseRef.current) {
      return savePromiseRef.current;
    }

    if (validItems.length === 0) {
      const validationMessage =
        "Ajoute au moins un produit valide avant d'enregistrer la fiche.";
      setError(validationMessage);
      setMessage("");
      throw new Error(validationMessage);
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    savePromiseRef.current = (async () => {
      const payload = {
        session_id: saleSessionId,
        date: new Date().toISOString(),
        mode_paiement: paymentMethod,
        signature_vendeur: user?.name || "Vendeur",
        items: validItems,
      };

      const data = await createSaleReceiptRequest(payload);
      setCreatedReceipt(data.receipt);
      setSaved(true);
      setMessage(`Fiche enregistree : ${data.receipt.code_recu}`);
      return data.receipt;
    })();

    try {
      return await savePromiseRef.current;
    } catch (requestError) {
      setSaved(false);
      setError(requestError.message || "Impossible d'enregistrer la fiche.");
      throw requestError;
    } finally {
      savePromiseRef.current = null;
      setIsSaving(false);
    }
  }

  const handleSave = async () => {
    try {
      await saveSaleIfNotSaved();
    } catch {
      // The UI already exposes the error state.
    }
  };

  const handleDownloadPdf = async () => {
    setError("");

    try {
      const receipt = await saveSaleIfNotSaved();
      await downloadReceiptPdf(receipt.code_recu);
      setMessage(`PDF telecharge : ${receipt.code_recu}`);
    } catch (requestError) {
      setError(requestError.message || "Impossible de telecharger le PDF.");
    }
  };

  const handlePrintReceipt = async () => {
    setError("");

    try {
      const receipt = await saveSaleIfNotSaved();
      const printWindow = window.open(
        `/receipt/print/${encodeURIComponent(receipt.code_recu)}`,
        "_blank"
      );

      if (!printWindow) {
        throw new Error("Le navigateur a bloque la fenetre d'impression.");
      }

      setMessage(`Impression du recu ${receipt.code_recu} lancee.`);
    } catch (requestError) {
      setError(requestError.message || "Impossible d'imprimer le recu.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="hidden lg:block">
            <Topbar
              title={isSeller ? "Caisse vendeur" : "Creer une fiche de vente"}
              subtitle={isSeller ? "POS" : "Creer fiche"}
            />
          </div>

          <section className="flex-1 px-3 pb-32 pt-3 sm:px-5 sm:pt-5 lg:px-8 lg:pb-8">
            <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 xl:grid xl:grid-cols-[minmax(0,1.7fr)_380px]">
              <section className="rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_60px_-34px_rgba(15,23,42,0.34)]">
                <div className="border-b border-slate-200 px-4 py-4 sm:px-6 lg:px-7">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
                        {isSeller ? "Mode caisse" : "Fiche de vente"}
                      </p>
                      <h1 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">
                        Enregistrer rapidement une nouvelle vente
                      </h1>
                      <p className="mt-2 text-sm text-slate-500">
                        Interface optimisee pour mobile et utilisation continue en point de vente.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                          Vendeur
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-950">
                          {user?.name || "Utilisateur"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addRow}
                        className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Ajouter ligne
                      </button>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-3 sm:px-5 lg:px-6 lg:py-5">
                  <div className="space-y-4 lg:hidden">
                    {lineItems.map((row, index) => (
                      <article
                        key={index}
                        className="rounded-[26px] border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                              Produit {index + 1}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {row.product || "Nouvelle ligne"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-600 shadow-sm"
                          >
                            Supprimer
                          </button>
                        </div>

                        <div className="mt-4 space-y-3">
                          <input
                            value={row.product}
                            onChange={(event) =>
                              handleChange(index, "product", event.target.value)
                            }
                            placeholder="Nom produit"
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                          />

                          <div className="grid grid-cols-2 gap-3">
                            <input
                              type="number"
                              min="1"
                              value={row.qty}
                              onChange={(event) =>
                                handleChange(
                                  index,
                                  "qty",
                                  Math.max(1, Number(event.target.value) || 1)
                                )
                              }
                              placeholder="Quantite"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            />
                            <input
                              type="number"
                              min="0"
                              value={row.price}
                              onChange={(event) =>
                                handleChange(
                                  index,
                                  "price",
                                  Math.max(0, Number(event.target.value) || 0)
                                )
                              }
                              placeholder="Prix"
                              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                            />
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-white">
                          <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                            Total ligne
                          </p>
                          <p className="mt-1 text-xl font-semibold">
                            {formatCurrency(row.total)}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full min-w-[860px] border-collapse">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="rounded-l-2xl p-4 text-left text-sm font-semibold text-slate-600">
                            Nom produit
                          </th>
                          <th className="p-4 text-center text-sm font-semibold text-slate-600">
                            Quantite
                          </th>
                          <th className="p-4 text-center text-sm font-semibold text-slate-600">
                            Prix unitaire
                          </th>
                          <th className="p-4 text-right text-sm font-semibold text-slate-600">
                            Total
                          </th>
                          <th className="rounded-r-2xl p-4" />
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((row, index) => (
                          <tr key={index} className="border-t border-slate-200">
                            <td className="p-3">
                              <input
                                value={row.product}
                                onChange={(event) =>
                                  handleChange(index, "product", event.target.value)
                                }
                                placeholder="Nom produit"
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="1"
                                value={row.qty}
                                onChange={(event) =>
                                  handleChange(
                                    index,
                                    "qty",
                                    Math.max(1, Number(event.target.value) || 1)
                                  )
                                }
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="number"
                                min="0"
                                value={row.price}
                                onChange={(event) =>
                                  handleChange(
                                    index,
                                    "price",
                                    Math.max(0, Number(event.target.value) || 0)
                                  )
                                }
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                              />
                            </td>
                            <td className="p-3 text-right text-sm font-semibold text-slate-950">
                              {formatCurrency(row.total)}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => removeRow(index)}
                                className="rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <aside className="hidden xl:block">
                <div className="sticky top-6 space-y-4">
                  <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.34)]">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                      Resume caisse
                    </p>
                    <div className="mt-5 rounded-[26px] bg-slate-950 px-5 py-5 text-white">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                        Total general
                      </p>
                      <p className="mt-2 text-4xl font-semibold">
                        {formatCurrency(totalGeneral)}
                      </p>
                    </div>

                    <label className="mt-5 block">
                      <span className="mb-2 block text-sm font-medium text-slate-600">
                        Mode de paiement
                      </span>
                      <select
                        value={paymentMethod}
                        onChange={(event) => {
                          markAsDirty();
                          setPaymentMethod(event.target.value);
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="Cash">Cash</option>
                        <option value="MonCash">MonCash</option>
                        <option value="Virement">Virement</option>
                      </select>
                    </label>

                    {createdReceipt?.code_recu ? (
                      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                        Code recu : {createdReceipt.code_recu}
                      </div>
                    ) : null}

                    {message ? (
                      <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                        {message}
                      </div>
                    ) : null}

                    {error ? (
                      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                      </div>
                    ) : null}
                  </section>

                  <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.34)]">
                    <div className="grid gap-3">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSaving ? "Enregistrement..." : "Enregistrer fiche"}
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadPdf}
                        className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Telecharger PDF
                      </button>
                      <button
                        type="button"
                        onClick={handlePrintReceipt}
                        className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                      >
                        Imprimer ticket
                      </button>
                    </div>
                  </section>
                </div>
              </aside>
            </div>
          </section>

          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-3xl flex-col gap-3">
              <div className="flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-white">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-300">
                    Total general
                  </p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(totalGeneral)}
                  </p>
                </div>

                <div className="w-40">
                  <label className="text-[11px] uppercase tracking-[0.24em] text-slate-300">
                    Paiement
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(event) => {
                      markAsDirty();
                      setPaymentMethod(event.target.value);
                    }}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="Cash" className="text-slate-900">
                      Cash
                    </option>
                    <option value="MonCash" className="text-slate-900">
                      MonCash
                    </option>
                    <option value="Virement" className="text-slate-900">
                      Virement
                    </option>
                  </select>
                </div>
              </div>

              {message ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                  {message}
                </div>
              ) : null}

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-2xl bg-emerald-500 px-3 py-4 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "..." : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="rounded-2xl bg-blue-600 px-3 py-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="rounded-2xl bg-slate-900 px-3 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Imprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default CreateSale;
