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

export default function CreateSale() {
  const user = getStoredUser();
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

  const validItems = useMemo(
    () =>
      rows
        .filter((row) => row.product.trim())
        .map((row) => ({
          nom_produit: row.product.trim(),
          quantite: Number(row.qty) || 0,
          prix_unitaire: Number(row.price) || 0,
        }))
        .filter((item) => item.quantite > 0 && item.prix_unitaire >= 0),
    [rows]
  );

  const totalGeneral = useMemo(
    () =>
      rows.reduce(
        (sum, row) => sum + (Number(row.qty) || 0) * (Number(row.price) || 0),
        0
      ),
    [rows]
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
      setMessage(`Fiche enregistrée : ${data.receipt.code_recu}`);
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
      // Error state is already handled in saveSaleIfNotSaved.
    }
  };

  const handleDownloadPdf = async () => {
    setError("");

    try {
      const receipt = await saveSaleIfNotSaved();
      await downloadReceiptPdf(receipt.code_recu);
      setMessage(`PDF téléchargé : ${receipt.code_recu}`);
    } catch (requestError) {
      setError(requestError.message || "Impossible de télécharger le PDF.");
    }
  };

  const handlePrintPdf = async () => {
    setError("");

    try {
      const receipt = await saveSaleIfNotSaved();
      const printWindow = window.open(
        `/receipt/print/${encodeURIComponent(receipt.code_recu)}`,
        "_blank"
      );

      if (!printWindow) {
        throw new Error("Le navigateur a bloqué la fenêtre d'impression.");
      }

      setMessage(`Impression du reçu ${receipt.code_recu} lancée.`);
    } catch (requestError) {
      setError(requestError.message || "Impossible d'imprimer le reçu.");
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title="Créer une fiche de vente" subtitle="Créer fiche" />

          <section className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl space-y-6">
              <section className="rounded-xl bg-white p-5 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                      Fiche de vente
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                      Tableau des produits
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Remplis les lignes puis enregistre la fiche pour générer le reçu.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addRow}
                    className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Ajouter ligne
                  </button>
                </div>

                <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full min-w-[760px] border-collapse">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-3 text-left text-sm font-semibold text-slate-600">
                          Nom produit
                        </th>
                        <th className="p-3 text-center text-sm font-semibold text-slate-600">
                          Quantité
                        </th>
                        <th className="p-3 text-center text-sm font-semibold text-slate-600">
                          Prix unitaire
                        </th>
                        <th className="p-3 text-center text-sm font-semibold text-slate-600">
                          Total
                        </th>
                        <th className="p-3" />
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="p-2">
                            <input
                              className="w-full rounded-lg px-3 py-3 text-sm outline-none transition focus:bg-blue-50 focus:ring-2 focus:ring-blue-200"
                              value={row.product}
                              onChange={(event) =>
                                handleChange(index, "product", event.target.value)
                              }
                              placeholder="Nom produit"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              className="w-full rounded-lg px-3 py-3 text-center text-sm outline-none transition focus:bg-blue-50 focus:ring-2 focus:ring-blue-200"
                              value={row.qty}
                              min="1"
                              onChange={(event) =>
                                handleChange(
                                  index,
                                  "qty",
                                  Math.max(1, Number(event.target.value) || 1)
                                )
                              }
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              className="w-full rounded-lg px-3 py-3 text-center text-sm outline-none transition focus:bg-blue-50 focus:ring-2 focus:ring-blue-200"
                              value={row.price}
                              min="0"
                              onChange={(event) =>
                                handleChange(
                                  index,
                                  "price",
                                  Math.max(0, Number(event.target.value) || 0)
                                )
                              }
                            />
                          </td>

                          <td className="p-2 text-center text-sm font-semibold text-slate-900">
                            {((Number(row.qty) || 0) * (Number(row.price) || 0)).toLocaleString(
                              "fr-FR"
                            )}{" "}
                            HTG
                          </td>

                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeRow(index)}
                              className="rounded-lg px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-600">
                      Mode de paiement
                    </span>
                    <select
                      value={paymentMethod}
                      onChange={(event) => {
                        markAsDirty();
                        setPaymentMethod(event.target.value);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="Cash">Cash</option>
                      <option value="MonCash">MonCash</option>
                      <option value="Virement">Virement</option>
                    </select>
                  </label>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-medium text-slate-600">Vendeur</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {user?.name || "Utilisateur"}
                    </p>
                  </div>
                </div>

                {error ? (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                ) : null}

                {message ? (
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {message}
                  </div>
                ) : null}
              </section>

              <section className="rounded-xl bg-white p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Total général
                </p>
                <div className="mt-4 text-3xl font-bold text-slate-950 sm:text-4xl">
                  TOTAL GENERAL : {totalGeneral.toLocaleString("fr-FR")} HTG
                </div>
                {createdReceipt?.code_recu ? (
                  <p className="mt-3 text-sm font-medium text-slate-500">
                    Code reçu : {createdReceipt.code_recu}
                  </p>
                ) : null}
              </section>

              <section className="rounded-xl bg-white p-5 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Enregistrement..." : "Enregistrer fiche"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                  >
                    Télécharger PDF
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintPdf}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    Imprimer
                  </button>
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
