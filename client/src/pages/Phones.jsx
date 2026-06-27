import { useCallback, useEffect, useRef, useState } from "react";

import AppShell from "../components/AppShell";
import {
  createPhone,
  deletePhone,
  listPhones,
  updatePhone,
} from "../services/phoneApi";

const STATUS_LABELS = {
  disponible: "Disponible",
  vendu: "Vendu",
  en_reparation: "En réparation",
};

const STATUS_STYLES = {
  disponible:
    "bg-emerald-100 text-emerald-700 border border-emerald-200",
  vendu: "bg-slate-100 text-slate-600 border border-slate-200",
  en_reparation: "bg-amber-100 text-amber-700 border border-amber-200",
};

const formatPrice = (value) =>
  Number(value).toLocaleString("fr-FR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="fixed right-3 top-3 z-50 w-[calc(100%-1.5rem)] max-w-sm sm:right-4 sm:top-4 sm:w-full">
      <div
        className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${
          toast.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em]"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

const EMPTY_FORM = {
  imei: "",
  modele: "",
  couleur: "",
  prix_achat: "",
  prix_vente: "",
  notes: "",
};

function PhoneModal({ phone, onClose, onSaved }) {
  const [form, setForm] = useState(
    phone
      ? {
          imei: phone.imei,
          modele: phone.modele,
          couleur: phone.couleur || "",
          prix_achat: phone.prix_achat,
          prix_vente: phone.prix_vente,
          notes: phone.notes || "",
        }
      : EMPTY_FORM
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const firstInputRef = useRef(null);

  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        imei: form.imei.trim(),
        modele: form.modele.trim(),
        couleur: form.couleur.trim() || undefined,
        prix_achat: Number(form.prix_achat),
        prix_vente: Number(form.prix_vente),
        notes: form.notes.trim() || undefined,
      };

      if (phone) {
        const { imei: _imei, ...updatePayload } = payload;
        await updatePhone(phone.id, updatePayload);
      } else {
        await createPhone(payload);
      }

      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4">
      <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {phone ? "Modifier le téléphone" : "Ajouter un téléphone"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                IMEI *
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={form.imei}
                onChange={set("imei")}
                placeholder="354765010123456"
                readOnly={Boolean(phone)}
                className={`w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${
                  phone ? "bg-slate-50 text-slate-500" : "bg-white"
                }`}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Modèle *
              </label>
              <input
                type="text"
                value={form.modele}
                onChange={set("modele")}
                placeholder="iPhone 14 Pro"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Couleur
              </label>
              <input
                type="text"
                value={form.couleur}
                onChange={set("couleur")}
                placeholder="Noir"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Prix achat (USD) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.prix_achat}
                onChange={set("prix_achat")}
                placeholder="0.00"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Prix vente (USD) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.prix_vente}
                onChange={set("prix_vente")}
                placeholder="0.00"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={2}
              placeholder="État, accessoires inclus..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Enregistrement..."
              : phone
              ? "Enregistrer les modifications"
              : "Ajouter le téléphone"}
          </button>
        </form>
      </div>
    </div>
  );
}

const TABS = [
  { key: "", label: "Tous" },
  { key: "disponible", label: "Disponible" },
  { key: "vendu", label: "Vendu" },
  { key: "en_reparation", label: "En réparation" },
];

function Phones() {
  const [phones, setPhones] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modal, setModal] = useState(null); // null | 'create' | phone object
  const [toast, setToast] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const data = await listPhones({
        statut: activeTab || undefined,
        search: debouncedSearch || undefined,
      });
      setPhones(data.phones);
      setTotal(data.total);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = () => {
    setModal(null);
    load();
    showToast(
      modal && typeof modal === "object"
        ? "Téléphone modifié avec succès."
        : "Téléphone ajouté avec succès."
    );
  };

  const handleDelete = async (phone) => {
    if (!window.confirm(`Supprimer le téléphone "${phone.imei} — ${phone.modele}" ?`)) {
      return;
    }

    setDeleting(phone.id);

    try {
      await deletePhone(phone.id);
      showToast("Téléphone supprimé.");
      load();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <AppShell title="Téléphones" subtitle={`${total} appareil${total !== 1 ? "s" : ""}`}>
      <Toast toast={toast} onClose={() => setToast(null)} />

      {modal !== null ? (
        <PhoneModal
          phone={typeof modal === "object" ? modal : null}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      ) : null}

      {/* Barre d'outils */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex overflow-x-auto gap-1 rounded-2xl border border-slate-200 bg-white p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === tab.key
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher IMEI, modèle..."
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:w-56 sm:flex-none"
          />
          <button
            type="button"
            onClick={() => setModal("create")}
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + Ajouter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-slate-400">
            Chargement...
          </div>
        ) : phones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-medium text-slate-500">
              Aucun téléphone trouvé
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {search || activeTab
                ? "Essayez de modifier les filtres."
                : "Ajoutez votre premier téléphone."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">IMEI</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Modèle</th>
                  <th className="hidden px-4 py-3 font-semibold text-slate-600 sm:table-cell">
                    Couleur
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-slate-600 md:table-cell">
                    Prix achat
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Prix vente</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {phones.map((phone) => (
                  <tr key={phone.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {phone.imei}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {phone.modele}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                      {phone.couleur || "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 md:table-cell">
                      {formatPrice(phone.prix_achat)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatPrice(phone.prix_vente)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-xl px-2.5 py-1 text-xs font-semibold ${
                          STATUS_STYLES[phone.statut]
                        }`}
                      >
                        {STATUS_LABELS[phone.statut]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setModal(phone)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Modifier
                        </button>
                        {phone.statut === "disponible" ? (
                          <button
                            type="button"
                            disabled={deleting === phone.id}
                            onClick={() => handleDelete(phone)}
                            className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Suppr.
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Marge de rentabilité en bas */}
      {phones.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TABS.slice(1).map((tab) => {
            const count = phones.filter((p) => p.statut === tab.key).length;
            return (
              <div
                key={tab.key}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  {tab.label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{count}</p>
              </div>
            );
          })}
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Marge potentielle
            </p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">
              {formatPrice(
                phones
                  .filter((p) => p.statut === "disponible")
                  .reduce(
                    (sum, p) => sum + (Number(p.prix_vente) - Number(p.prix_achat)),
                    0
                  )
              )}
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default Phones;
