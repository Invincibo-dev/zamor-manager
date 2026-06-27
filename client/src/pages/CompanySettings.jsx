import { useEffect, useRef, useState } from "react";

import { useCompany } from "../context/CompanyContext";
import { updateCompanySettings } from "../services/companyApi";
import {
  downloadDatabaseBackup,
  downloadSavedBackup,
  getBackupList,
} from "../services/backupApi";

function CompanySettings() {
  const { settings, loading, refresh } = useCompany();

  const [form, setForm] = useState({ name: "", address: "", phone: "", exchange_rate: "132" });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null); // { type: "success"|"error", message }
  const [backupLoading, setBackupLoading] = useState(false);
  const [savedBackups, setSavedBackups] = useState([]);
  const [backupError, setBackupError] = useState(null);
  const fileInputRef = useRef(null);
  const statusTimer = useRef(null);

  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name || "",
        address: settings.address || "",
        phone: settings.phone || "",
        exchange_rate: settings.exchange_rate != null ? String(settings.exchange_rate) : "132",
      });
      setLogoPreview(settings.logo_data || null);
    }
  }, [settings]);

  useEffect(() => {
    getBackupList()
      .then(setSavedBackups)
      .catch(() => {}); // optionnel — pas critique
  }, []);

  const handleBackupNow = async () => {
    setBackupLoading(true);
    setBackupError(null);
    try {
      await downloadDatabaseBackup();
    } catch (err) {
      setBackupError(err.message || "Erreur lors du backup.");
    } finally {
      setBackupLoading(false);
    }
  };

  const showStatus = (type, message) => {
    clearTimeout(statusTimer.current);
    setStatus({ type, message });
    statusTimer.current = setTimeout(() => setStatus(null), 4000);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/png", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      showStatus("error", "Type de fichier non autorisé. Utilisez JPG, PNG ou SVG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showStatus("error", "Le fichier dépasse la limite de 2 Mo.");
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showStatus("error", "Le nom de l'entreprise est requis.");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      fd.append("address", form.address.trim());
      fd.append("phone", form.phone.trim());
      fd.append("exchange_rate", form.exchange_rate || "132");
      if (logoFile) fd.append("logo", logoFile);

      await updateCompanySettings(fd);
      await refresh(); // Met à jour le contexte global → Sidebar se rafraîchit
      setLogoFile(null);
      showStatus("success", "Paramètres sauvegardés avec succès.");
    } catch (err) {
      showStatus("error", err.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-950">
          Paramètres d&rsquo;entreprise
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Ces informations apparaissent sur les reçus et dans l&rsquo;application.
        </p>
      </div>

      {status && (
        <div
          className={`mb-5 rounded-2xl px-4 py-3 text-sm font-medium ${
            status.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Logo */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Logo
          </p>
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo entreprise"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-2xl font-bold text-slate-300">
                  {form.name?.[0]?.toUpperCase() || "Z"}
                </span>
              )}
            </div>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {logoPreview ? "Changer le logo" : "Uploader un logo"}
              </button>
              <p className="mt-1.5 text-xs text-slate-400">
                JPG, PNG ou SVG — max 2 Mo
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/svg+xml"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
          </div>
        </div>

        {/* Champs texte */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Informations
          </p>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Nom de l&rsquo;entreprise *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                maxLength={200}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white"
                placeholder="Zamor Multi Services Acces"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Adresse
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                maxLength={500}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white"
                placeholder="Adresse de l'entreprise"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Téléphone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                maxLength={100}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-slate-400 focus:bg-white"
                placeholder="+509 XXXX-XXXX"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Taux de change — 1 USD =
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.exchange_rate}
                  onChange={(e) => setForm((f) => ({ ...f, exchange_rate: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
                  placeholder="132.00"
                />
                <span className="shrink-0 text-sm font-semibold text-slate-500">HTG</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Sauvegarde en cours…" : "Sauvegarder"}
        </button>
      </form>

      {/* Section Sauvegardes */}
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Sauvegardes base de données
        </p>
        <p className="mb-4 text-xs text-slate-400">
          Sauvegarde automatique chaque nuit à 2h UTC. Téléchargez une copie maintenant pour la
          conserver en lieu sûr.
        </p>

        {backupError && (
          <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
            {backupError}
          </div>
        )}

        <button
          type="button"
          onClick={handleBackupNow}
          disabled={backupLoading}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {backupLoading ? "Génération en cours…" : "Télécharger sauvegarde SQL"}
        </button>

        {savedBackups.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-slate-500">Sauvegardes auto disponibles</p>
            <ul className="space-y-1.5">
              {savedBackups.map((b) => (
                <li
                  key={b.name}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                >
                  <div>
                    <span className="text-xs font-medium text-slate-700">{b.name}</span>
                    <span className="ml-2 text-xs text-slate-400">
                      {Math.round(b.size / 1024)} KB
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadSavedBackup(b.name)}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Télécharger
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompanySettings;
