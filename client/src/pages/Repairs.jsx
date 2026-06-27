import { useCallback, useEffect, useRef, useState } from "react";

import AppShell from "../components/AppShell";
import { listPhones } from "../services/phoneApi";
import {
  createRepair,
  deleteRepair,
  listRepairs,
  updateRepair,
} from "../services/repairApi";

const STATUS_LABELS = {
  en_attente: "En attente",
  en_cours: "En cours",
  termine: "Terminé",
  livre: "Livré",
};

const STATUS_STYLES = {
  en_attente: "bg-amber-100 text-amber-700 border border-amber-200",
  en_cours: "bg-blue-100 text-blue-700 border border-blue-200",
  termine: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  livre: "bg-slate-100 text-slate-600 border border-slate-200",
};

const today = () => new Date().toISOString().slice(0, 10);

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

function CreateRepairModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    client_nom: "",
    client_telephone: "",
    phone_id: "",
    phone_description: "",
    panne: "",
    cout_estimation: "",
    date_depot: today(),
    date_livraison_estimee: "",
    notes: "",
  });
  const [availablePhones, setAvailablePhones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const firstInputRef = useRef(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    listPhones({ statut: "disponible", limit: 200 })
      .then((d) => setAvailablePhones(d.phones))
      .catch(() => {});
  }, []);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        client_nom: form.client_nom.trim(),
        client_telephone: form.client_telephone.trim() || undefined,
        phone_id: form.phone_id ? Number(form.phone_id) : undefined,
        phone_description: form.phone_description.trim() || undefined,
        panne: form.panne.trim(),
        cout_estimation: form.cout_estimation ? Number(form.cout_estimation) : undefined,
        date_depot: form.date_depot,
        date_livraison_estimee: form.date_livraison_estimee || undefined,
        notes: form.notes.trim() || undefined,
      };

      await createRepair(payload);
      onSaved("Réparation créée avec succès.");
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
          <h2 className="text-lg font-semibold text-slate-900">Nouvelle réparation</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nom du client *
              </label>
              <input
                ref={firstInputRef}
                type="text"
                value={form.client_nom}
                onChange={set("client_nom")}
                placeholder="Jean Dupont"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Téléphone client
              </label>
              <input
                type="tel"
                value={form.client_telephone}
                onChange={set("client_telephone")}
                placeholder="+509 3XXX-XXXX"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Appareil (stock)
            </label>
            <select
              value={form.phone_id}
              onChange={set("phone_id")}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">— Sélectionner un téléphone du stock —</option>
              {availablePhones.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.imei} — {p.modele}
                  {p.couleur ? ` (${p.couleur})` : ""}
                </option>
              ))}
            </select>
          </div>

          {!form.phone_id && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Description appareil client
              </label>
              <input
                type="text"
                value={form.phone_description}
                onChange={set("phone_description")}
                placeholder="Samsung Galaxy A54 noir"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description de la panne *
            </label>
            <textarea
              value={form.panne}
              onChange={set("panne")}
              rows={3}
              placeholder="Écran cassé, batterie déchargée rapidement..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Estimation ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cout_estimation}
                onChange={set("cout_estimation")}
                placeholder="0.00"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Date dépôt *
              </label>
              <input
                type="date"
                value={form.date_depot}
                onChange={set("date_depot")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Livraison estimée
              </label>
              <input
                type="date"
                value={form.date_livraison_estimee}
                onChange={set("date_livraison_estimee")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Notes internes
            </label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={2}
              placeholder="Mot de passe, accessoires reçus..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
            {loading ? "Enregistrement..." : "Créer la réparation"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EditRepairModal({ repair, onClose, onSaved }) {
  const [form, setForm] = useState({
    statut: repair.statut,
    cout_final: repair.cout_final ?? "",
    date_livraison_estimee: repair.date_livraison_estimee ?? "",
    date_livraison_reelle: repair.date_livraison_reelle ?? "",
    notes: repair.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        statut: form.statut,
        cout_final: form.cout_final !== "" ? Number(form.cout_final) : undefined,
        date_livraison_estimee: form.date_livraison_estimee || undefined,
        date_livraison_reelle: form.date_livraison_reelle || undefined,
        notes: form.notes.trim() || undefined,
      };

      await updateRepair(repair.id, payload);
      onSaved("Réparation mise à jour.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const appareil = repair.phone
    ? `${repair.phone.imei} — ${repair.phone.modele}`
    : repair.phone_description || "—";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4">
      <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
              {repair.ticket}
            </p>
            <h2 className="text-lg font-semibold text-slate-900">{repair.client_nom}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>

        <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p><span className="font-medium">Appareil:</span> {appareil}</p>
          <p className="mt-1"><span className="font-medium">Panne:</span> {repair.panne}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Statut</label>
            <select
              value={form.statut}
              onChange={set("statut")}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="en_attente">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="livre">Livré</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Coût final ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.cout_final}
                onChange={set("cout_final")}
                placeholder="0.00"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Livraison estimée
              </label>
              <input
                type="date"
                value={form.date_livraison_estimee}
                onChange={set("date_livraison_estimee")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Livraison réelle
              </label>
              <input
                type="date"
                value={form.date_livraison_reelle}
                onChange={set("date_livraison_reelle")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Notes internes
            </label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={2}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
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
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}

const TABS = [
  { key: "", label: "Tous" },
  { key: "en_attente", label: "En attente" },
  { key: "en_cours", label: "En cours" },
  { key: "termine", label: "Terminé" },
  { key: "livre", label: "Livré" },
];

function Repairs() {
  const [repairs, setRepairs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modal, setModal] = useState(null); // null | 'create' | repair object
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
      const data = await listRepairs({
        statut: activeTab || undefined,
        search: debouncedSearch || undefined,
      });
      setRepairs(data.repairs);
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

  const handleSaved = (message) => {
    setModal(null);
    load();
    showToast(message);
  };

  const handleDelete = async (repair) => {
    if (
      !window.confirm(
        `Supprimer la réparation "${repair.ticket}" (${repair.client_nom}) ?`
      )
    ) {
      return;
    }

    setDeleting(repair.id);

    try {
      await deleteRepair(repair.id);
      showToast("Réparation supprimée.");
      load();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (val) => {
    if (!val) return "—";
    return new Date(val).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <AppShell
      title="Réparations"
      subtitle={`${total} ticket${total !== 1 ? "s" : ""}`}
    >
      <Toast toast={toast} onClose={() => setToast(null)} />

      {modal === "create" ? (
        <CreateRepairModal
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      ) : modal && typeof modal === "object" ? (
        <EditRepairModal
          repair={modal}
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
            placeholder="Ticket, client, panne..."
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:w-52 sm:flex-none"
          />
          <button
            type="button"
            onClick={() => setModal("create")}
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            + Nouveau
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-slate-400">
            Chargement...
          </div>
        ) : repairs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-medium text-slate-500">Aucune réparation trouvée</p>
            <p className="mt-1 text-xs text-slate-400">
              {search || activeTab
                ? "Essayez de modifier les filtres."
                : "Créez votre premier ticket de réparation."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-600">Ticket</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Client</th>
                  <th className="hidden px-4 py-3 font-semibold text-slate-600 md:table-cell">
                    Appareil
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-slate-600 lg:table-cell">
                    Panne
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-slate-600 sm:table-cell">
                    Dépôt
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-slate-600 sm:table-cell">
                    Livraison est.
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Statut</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repairs.map((repair) => (
                  <tr key={repair.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-orange-600">
                        {repair.ticket}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{repair.client_nom}</p>
                      {repair.client_telephone ? (
                        <p className="text-xs text-slate-400">{repair.client_telephone}</p>
                      ) : null}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
                      {repair.phone
                        ? `${repair.phone.modele}`
                        : repair.phone_description || "—"}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 lg:table-cell">
                      <span title={repair.panne}>
                        {repair.panne.length > 55
                          ? repair.panne.slice(0, 55) + "…"
                          : repair.panne}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                      {formatDate(repair.date_depot)}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">
                      {formatDate(repair.date_livraison_estimee)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-xl px-2.5 py-1 text-xs font-semibold ${
                          STATUS_STYLES[repair.statut]
                        }`}
                      >
                        {STATUS_LABELS[repair.statut]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setModal(repair)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Modifier
                        </button>
                        {repair.statut === "en_attente" ? (
                          <button
                            type="button"
                            disabled={deleting === repair.id}
                            onClick={() => handleDelete(repair)}
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

      {/* Compteurs par statut */}
      {repairs.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TABS.slice(1).map((tab) => {
            const count = repairs.filter((r) => r.statut === tab.key).length;
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
        </div>
      )}
    </AppShell>
  );
}

export default Repairs;
