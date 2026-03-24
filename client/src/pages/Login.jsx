import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { loginRequest } from "../services/api";
import { getStoredUser, saveSession } from "../utils/auth";

function Login() {
  const navigate = useNavigate();
  const existingUser = getStoredUser();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (existingUser) {
    return (
      <Navigate
        to={existingUser.role === "admin" ? "/dashboard" : "/create-sale"}
        replace
      />
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await loginRequest(formData);
      saveSession({ token: data.token, user: data.user });
      navigate(data.user.role === "admin" ? "/dashboard" : "/create-sale", {
        replace: true,
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_28%,#fff7ed_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_70px_-28px_rgba(15,23,42,0.35)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.32),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(249,115,22,0.28),_transparent_30%)]" />

          <div className="relative">
            <p className="text-xs uppercase tracking-[0.45em] text-orange-300">
              Zamor Manager
            </p>
            <h1 className="mt-6 max-w-lg text-5xl font-semibold leading-[1.05]">
              Une console claire pour les ventes, les reçus et les rapports.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
              Connectez-vous pour gérer vos fiches de vente, suivre l'activité
              quotidienne et produire des reçus PDF propres.
            </p>
          </div>

          <div className="relative grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Entreprise
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">
                Zamor Multi Services Acces
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  Reçus
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">PDF</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                  Vue
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">SaaS</p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center px-6 py-10 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="lg:hidden">
              <p className="text-xs uppercase tracking-[0.45em] text-orange-600">
                Zamor Manager
              </p>
              <h1 className="mt-4 text-3xl font-semibold text-slate-950">
                Connexion à l'espace de gestion
              </h1>
            </div>

            <div className="mt-2 lg:mt-0">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
                Connexion
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-950">
                Accéder à votre compte
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Utilisez vos identifiants pour ouvrir le dashboard ou la page
                de création de fiche.
              </p>
            </div>

            <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="exemple@zamor.local"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Votre mot de passe"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                Accès rapide
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Admin
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    Dashboard complet
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Vendeur
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    Fiche de vente directe
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Login;
