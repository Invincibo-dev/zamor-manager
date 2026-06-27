import { useCallback, useEffect, useState } from "react";

import AppShell from "../components/AppShell";
import {
  createClient,
  deleteClient,
  listClients,
  updateClient,
} from "../services/clientApi";
import {
  addDebtPayment,
  createDebt,
  deleteDebt,
  listDebts,
  updateDebt,
} from "../services/debtApi";

const fmt = (v) =>
  Number(v || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " HTG";

const today = () => new Date().toISOString().slice(0, 10);

// ─── Statut badges ───────────────────────────────────────────────────────────

const DEBT_STATUT_LABEL = {
  en_cours: "En cours",
  remboursee: "Remboursée",
  annulee: "Annulée",
};

const DEBT_STATUT_CLASS = {
  en_cours: "bg-amber-100 text-amber-700",
  remboursee: "bg-emerald-100 text-emerald-700",
  annulee: "bg-slate-100 text-slate-500",
};

function StatutBadge({ statut }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${DEBT_STATUT_CLASS[statut] ?? "bg-slate-100 text-slate-500"}`}
    >
      {DEBT_STATUT_LABEL[statut] ?? statut}
    </span>
  );
}

// ─── Client modal (create / edit) ────────────────────────────────────────────

function ClientModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState({
    nom: initial?.nom ?? "",
    telephone: initial?.telephone ?? "",
    email: initial?.email ?? "",
    notes: initial?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handle = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        nom: form.nom.trim(),
        telephone: form.telephone.trim() || undefined,
        email: form.email.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      const data = initial
        ? await updateClient(initial.id, payload)
        : await createClient(payload);
      onSave(data.client);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            {initial ? "Modifier client" : "Nouveau client"}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          ) : null}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Nom *
            </label>
            <input
              value={form.nom}
              onChange={handle("nom")}
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Téléphone
              </label>
              <input
                value={form.telephone}
                onChange={handle("telephone")}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={handle("email")}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={handle("notes")}
              rows={2}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create debt modal ────────────────────────────────────────────────────────

function CreateDebtModal({ clients, onSave, onClose }) {
  const [form, setForm] = useState({
    client_id: "",
    montant_total: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handle = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = await createDebt({
        client_id: Number(form.client_id),
        montant_total: Number(form.montant_total),
        notes: form.notes.trim() || undefined,
      });
      onSave(data.debt);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            Nouvelle dette
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          ) : null}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Client *
            </label>
            <select
              value={form.client_id}
              onChange={handle("client_id")}
              required
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}{c.telephone ? ` — ${c.telephone}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Montant total dû (HTG) *
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={form.montant_total}
              onChange={handle("montant_total")}
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={handle("notes")}
              rows={2}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-emerald-500 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {saving ? "Enregistrement..." : "Créer la dette"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Add payment modal ────────────────────────────────────────────────────────

function AddPaymentModal({ debt, onSave, onClose }) {
  const maxRestant = Math.max(
    0,
    Number(debt.montant_total) - Number(debt.montant_paye)
  );
  const [form, setForm] = useState({
    montant: String(maxRestant.toFixed(2)),
    mode_paiement: "Cash",
    date_paiement: today(),
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handle = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = await addDebtPayment(debt.id, {
        montant: Number(form.montant),
        mode_paiement: form.mode_paiement,
        date_paiement: form.date_paiement,
        note: form.note.trim() || undefined,
      });
      onSave(data.debt);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            Ajouter un paiement
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {debt.client?.nom} — Reste {fmt(maxRestant)}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4 p-5">
          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
          ) : null}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Montant (HTG) *
            </label>
            <input
              type="number"
              min="0.01"
              max={maxRestant}
              step="0.01"
              value={form.montant}
              onChange={handle("montant")}
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Mode
              </label>
              <select
                value={form.mode_paiement}
                onChange={handle("mode_paiement")}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                <option>Cash</option>
                <option>MonCash</option>
                <option>Virement</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Date *
              </label>
              <input
                type="date"
                value={form.date_paiement}
                onChange={handle("date_paiement")}
                required
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Note
            </label>
            <input
              value={form.note}
              onChange={handle("note")}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-emerald-500 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              {saving ? "Enregistrement..." : "Valider paiement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Clients tab ──────────────────────────────────────────────────────────────

function ClientsTab() {
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null); // null | { mode: "create" } | { mode: "edit", client }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listClients({ search, limit: 100 });
      setClients(data.clients);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleSave = (client) => {
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === client.id);
      return idx >= 0
        ? prev.map((c) => (c.id === client.id ? client : c))
        : [client, ...prev];
    });
    setModal(null);
  };

  const handleDelete = async (client) => {
    if (!window.confirm(`Supprimer le client "${client.nom}" ?`)) return;
    try {
      await deleteClient(client.id);
      setClients((prev) => prev.filter((c) => c.id !== client.id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un client..."
          className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        />
        <button
          type="button"
          onClick={() => setModal({ mode: "create" })}
          className="rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + Nouveau client
        </button>
      </div>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-3xl bg-slate-50 px-6 py-12 text-center">
          <p className="text-sm text-slate-400">
            {search ? "Aucun client trouvé." : "Aucun client enregistré."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <p className="text-xs text-slate-500">
              {total} client{total > 1 ? "s" : ""}
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {clients.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{c.nom}</p>
                  <p className="text-xs text-slate-400">
                    {c.telephone ?? "—"}
                    {c.email ? ` • ${c.email}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {Number(c.solde_du) > 0 ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      Dû : {fmt(c.solde_du)}
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                      Soldé
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setModal({ mode: "edit", client: c })}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal ? (
        <ClientModal
          initial={modal.mode === "edit" ? modal.client : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      ) : null}
    </>
  );
}

// ─── Debts tab ────────────────────────────────────────────────────────────────

function DebtsTab() {
  const [debts, setDebts] = useState([]);
  const [total, setTotal] = useState(0);
  const [statutFilter, setStatutFilter] = useState("en_cours");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [allClients, setAllClients] = useState([]);
  const [modal, setModal] = useState(null); // null | "create" | { debt }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [debtsData, clientsData] = await Promise.all([
        listDebts({ statut: statutFilter || undefined, search, limit: 100 }),
        listClients({ limit: 200 }),
      ]);
      setDebts(debtsData.debts);
      setTotal(debtsData.total);
      setAllClients(clientsData.clients);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statutFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleDebtSaved = (debt) => {
    setDebts((prev) => {
      const idx = prev.findIndex((d) => d.id === debt.id);
      if (idx >= 0) return prev.map((d) => (d.id === debt.id ? debt : d));
      return [debt, ...prev];
    });
    setModal(null);
  };

  const handleDelete = async (debt) => {
    if (!window.confirm("Supprimer cette dette ?")) return;
    try {
      await deleteDebt(debt.id);
      setDebts((prev) => prev.filter((d) => d.id !== debt.id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = async (debt) => {
    if (!window.confirm("Annuler cette dette ?")) return;
    try {
      const data = await updateDebt(debt.id, { statut: "annulee" });
      setDebts((prev) =>
        prev.map((d) => (d.id === debt.id ? { ...d, ...data.debt } : d))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const FILTERS = [
    { value: "en_cours", label: "En cours" },
    { value: "remboursee", label: "Remboursées" },
    { value: "annulee", label: "Annulées" },
    { value: "", label: "Toutes" },
  ];

  return (
    <>
      {/* Filters + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatutFilter(f.value)}
              className={`rounded-2xl px-3 py-1.5 text-xs font-semibold transition ${
                statutFilter === f.value
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom client..."
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={() => setModal("create")}
            className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            + Nouvelle dette
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : debts.length === 0 ? (
        <div className="rounded-3xl bg-slate-50 px-6 py-12 text-center">
          <p className="text-sm text-slate-400">
            {search ? "Aucune dette trouvée." : "Aucune dette enregistrée."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {debts.map((debt) => {
            const restant = Math.max(0, Number(debt.montant_total) - Number(debt.montant_paye));
            const progress =
              Number(debt.montant_total) > 0
                ? Math.min(100, (Number(debt.montant_paye) / Number(debt.montant_total)) * 100)
                : 0;
            return (
              <div
                key={debt.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {debt.client?.nom ?? "—"}
                      </p>
                      <StatutBadge statut={debt.statut} />
                    </div>
                    {debt.client?.telephone ? (
                      <p className="text-xs text-slate-400">{debt.client.telephone}</p>
                    ) : null}
                    {debt.notes ? (
                      <p className="mt-1 text-xs text-slate-500 italic">{debt.notes}</p>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      Restant
                    </p>
                    <p className="text-xl font-semibold text-slate-950">{fmt(restant)}</p>
                    <p className="text-xs text-slate-400">
                      sur {fmt(debt.montant_total)} total
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="px-4 pb-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-[10px] text-slate-400">
                    Payé : {fmt(debt.montant_paye)} ({progress.toFixed(0)}%)
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3">
                  {debt.statut === "en_cours" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setModal({ debt })}
                        className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
                      >
                        Ajouter paiement
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancel(debt)}
                        className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        Annuler
                      </button>
                    </>
                  ) : null}
                  {Number(debt.montant_paye) === 0 ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(debt)}
                      className="rounded-xl px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      Supprimer
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal === "create" ? (
        <CreateDebtModal
          clients={allClients}
          onSave={handleDebtSaved}
          onClose={() => setModal(null)}
        />
      ) : modal?.debt ? (
        <AddPaymentModal
          debt={modal.debt}
          onSave={(updatedDebt) => {
            setDebts((prev) =>
              prev.map((d) =>
                d.id === updatedDebt.id ? { ...d, ...updatedDebt } : d
              )
            );
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      ) : null}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function Clients() {
  const [tab, setTab] = useState("clients");

  return (
    <AppShell title="Clients & Dettes" subtitle="Gestion des clients et créances">
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
          {[
            { key: "clients", label: "Clients" },
            { key: "dettes", label: "Dettes" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                tab === t.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "clients" ? <ClientsTab /> : <DebtsTab />}
      </div>
    </AppShell>
  );
}

export default Clients;
