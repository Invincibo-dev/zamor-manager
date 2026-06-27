import { useMemo, useRef, useState } from "react";

import AppShell from "../components/AppShell";
import BarcodeScanner from "../components/BarcodeScanner";
import { useCompany } from "../context/CompanyContext";
import { listPhones } from "../services/phoneApi";
import {
  createSaleReceiptRequest,
  downloadReceiptPdf,
} from "../services/saleApi";
import { getStoredUser } from "../utils/auth";
import { isThermalSupported, printThermal } from "../services/thermalPrinter";

const createRow = () => ({ product: "", qty: 1, price: 0, phone_id: null });
const createSaleSessionId = () => crypto.randomUUID();
const formatCurrency = (value, currency = "HTG") =>
  `${Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;

const buildWhatsAppText = (receipt, companyName = "Zamor") => {
  const date = new Date(receipt.date).toLocaleDateString("fr-FR");
  const devise = receipt.devise || "HTG";
  const fmt = (v) =>
    Number(v || 0).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const lines = (receipt.items || [])
    .map((item) => `  ${item.nom_produit} × ${item.quantite} = ${fmt(item.total)} ${devise}`)
    .join("\n");

  const total = `${fmt(receipt.total_general)} ${devise}`;
  const htgEquiv =
    devise === "USD" && receipt.taux_change
      ? `\n  (≈ ${fmt(Number(receipt.total_general) * Number(receipt.taux_change))} HTG)`
      : "";

  return (
    `🧾 *Reçu ${companyName}*\n` +
    `Code: ${receipt.code_recu}\n` +
    `Date: ${date}\n\n` +
    `${lines}\n\n` +
    `*TOTAL: ${total}*${htgEquiv}\n` +
    `Mode: ${receipt.mode_paiement}\n\n` +
    `Mèsi anpil! 🙏`
  );
};

function CreateSale() {
  const user = getStoredUser();
  const { settings } = useCompany();
  const exchangeRate = Number(settings?.exchange_rate || 132);

  const [rows, setRows] = useState([createRow()]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [devise, setDevise] = useState("HTG");
  const [saleSessionId, setSaleSessionId] = useState(createSaleSessionId);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [createdReceipt, setCreatedReceipt] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
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
          ...(row.phone_id ? { phone_id: row.phone_id } : {}),
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
        "Ajoute au moins un produit avant d'enregistrer.";
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
        date: new Date().toISOString().slice(0, 10),
        mode_paiement: paymentMethod,
        signature_vendeur: user?.name || "Vendeur",
        items: validItems,
        devise,
        taux_change: devise === "USD" ? exchangeRate : null,
      };

      const data = await createSaleReceiptRequest(payload);
      setCreatedReceipt(data.receipt);
      setSaved(true);
      setMessage(`Enregistre : ${data.receipt.code_recu}`);
      return data.receipt;
    })();

    try {
      return await savePromiseRef.current;
    } catch (requestError) {
      setSaved(false);
      setError(requestError.message || "Enregistrement impossible.");
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
      // UI already displays the error state.
    }
  };

  const handleDownloadPdf = async () => {
    setError("");

    try {
      const receipt = await saveSaleIfNotSaved();
      await downloadReceiptPdf(receipt.code_recu);
      setMessage(`PDF pret : ${receipt.code_recu}`);
    } catch (requestError) {
      setError(requestError.message || "Telechargement impossible.");
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
        throw new Error("Le navigateur a bloque l'impression.");
      }

      setMessage(`Impression lancee : ${receipt.code_recu}`);
    } catch (requestError) {
      setError(requestError.message || "Impression impossible.");
    }
  };

  const handleWhatsApp = async () => {
    setError("");

    try {
      const receipt = await saveSaleIfNotSaved();
      const text = buildWhatsAppText(receipt, settings?.name);
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    } catch (requestError) {
      setError(requestError.message || "Impossible d'ouvrir WhatsApp.");
    }
  };

  const handleThermalPrint = async () => {
    setError("");
    try {
      const receipt = await saveSaleIfNotSaved();
      await printThermal(receipt, settings || {});
    } catch (requestError) {
      setError(requestError.message || "Erreur impression thermique.");
    }
  };

  const handleScan = async (code) => {
    setScannerOpen(false);
    markAsDirty();

    try {
      const data = await listPhones({ search: code, statut: "disponible", limit: 5 });
      if (data.phones?.length === 1) {
        const phone = data.phones[0];
        const label = phone.couleur
          ? `${phone.modele} ${phone.couleur}`
          : phone.modele;
        setRows((prev) => [
          ...prev,
          { product: label, qty: 1, price: Number(phone.prix_vente), phone_id: phone.id },
        ]);
        return;
      }
    } catch {
      // Phone lookup failed (e.g. vendeur role has no access) — fall through
    }

    // Default: add row with scanned text so user can complete manually
    setRows((prev) => [...prev, { product: code, qty: 1, price: 0, phone_id: null }]);
  };

  return (
    <>
    <AppShell
      title="Mode POS"
      subtitle="Nouvelle vente"
      posMode
      contentClassName="pb-32 lg:pb-6"
    >
      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1.7fr)_360px]">
        <section className="rounded-[28px] bg-white shadow-[0_18px_45px_-28px_rgba(15,23,42,0.32)]">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-5 lg:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
                  Caisse mobile
                </p>
                <h1 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
                  Nouvelle vente
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Rapide, simple et pensee pour mobile.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    Vendeur
                  </p>
                  <p className="mt-1 font-semibold text-slate-950">{user?.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    markAsDirty();
                    setDevise((d) => (d === "HTG" ? "USD" : "HTG"));
                  }}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    devise === "USD"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {devise === "USD" ? `USD (1$=${exchangeRate}G)` : "HTG"}
                </button>
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12v.01M12 4h.01M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4z"
                    />
                  </svg>
                  Scanner
                </button>
                <button
                  type="button"
                  onClick={addRow}
                  className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Ajouter produit
                </button>
              </div>
            </div>
          </div>

          <div className="px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-5">
            <div className="space-y-4 lg:hidden">
              {lineItems.map((row, index) => (
                <article
                  key={index}
                  className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                        Produit {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {row.product || "Nouveau produit"}
                      </p>
                      {row.phone_id ? (
                        <span className="mt-1 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          Tél. #{row.phone_id}
                        </span>
                      ) : null}
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
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                        Produit
                      </label>
                      <input
                        value={row.product}
                        onChange={(event) =>
                          handleChange(index, "product", event.target.value)
                        }
                        placeholder="Nom produit"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Quantite
                        </label>
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
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Prix
                        </label>
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
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300">
                        Total
                      </p>
                      <p className="mt-1 text-xl font-semibold">
                        {formatCurrency(row.total, devise)}
                      </p>
                      {devise === "USD" ? (
                        <p className="text-[10px] text-slate-400">
                          ≈ {formatCurrency(row.total * exchangeRate, "HTG")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden lg:block">
              <div className="overflow-x-auto rounded-3xl border border-slate-200">
                <table className="w-full min-w-[860px] border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-slate-600">
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
                      <th className="p-4" />
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
                          {row.phone_id ? (
                            <div className="mt-1 text-right">
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                Tél. #{row.phone_id}
                              </span>
                            </div>
                          ) : null}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Retirer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {message ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 xl:hidden">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 xl:hidden">
                {error}
              </div>
            ) : null}
          </div>
        </section>

        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-4">
            <section className="rounded-[28px] bg-white p-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.32)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Resume caisse
              </p>
              <div className="mt-5 rounded-[24px] bg-slate-950 px-5 py-5 text-white">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                  Total
                </p>
                <p className="mt-2 text-4xl font-semibold">
                  {formatCurrency(totalGeneral, devise)}
                </p>
                {devise === "USD" ? (
                  <p className="mt-1 text-sm text-slate-400">
                    ≈ {formatCurrency(totalGeneral * exchangeRate, "HTG")}
                  </p>
                ) : null}
              </div>

              <label className="mt-5 block">
                <span className="mb-2 block text-sm font-medium text-slate-600">
                  Paiement
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
                  Recu : {createdReceipt.code_recu}
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

            <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.32)]">
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="rounded-2xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Telecharger
                </button>
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  Imprimer
                </button>
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  WhatsApp
                </button>
                {isThermalSupported() && (
                  <button
                    type="button"
                    onClick={handleThermalPrint}
                    className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                  >
                    Thermique
                  </button>
                )}
              </div>
            </section>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-3 py-3 backdrop-blur xl:hidden">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-300">
                  Total
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatCurrency(totalGeneral, devise)}
                </p>
                {devise === "USD" ? (
                  <p className="text-[10px] text-slate-400">
                    ≈ {formatCurrency(totalGeneral * exchangeRate, "HTG")}
                  </p>
                ) : null}
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
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-2xl bg-emerald-500 px-4 py-4 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "..." : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              PDF
            </button>
            <button
              type="button"
              onClick={handlePrintReceipt}
              className="w-full rounded-2xl bg-slate-900 px-4 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Imprimer
            </button>
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              WhatsApp
            </button>
            {isThermalSupported() && (
              <button
                type="button"
                onClick={handleThermalPrint}
                className="w-full rounded-2xl border border-violet-300 bg-violet-50 px-4 py-4 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
              >
                Thermique
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>

    {scannerOpen ? (
      <BarcodeScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />
    ) : null}
    </>
  );
}

export default CreateSale;
