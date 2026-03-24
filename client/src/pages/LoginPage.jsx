import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { loginRequest } from "../services/authApi";
import { getStoredUser, saveSession } from "../utils/auth";

function LoginPage() {
  const navigate = useNavigate();
  const existingUser = getStoredUser();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (existingUser) {
    return (
      <Navigate to={existingUser.role === "admin" ? "/admin" : "/seller"} replace />
    );
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await loginRequest(formData);

      saveSession({
        token: data.token,
        user: data.user,
      });

      navigate(data.user.role === "admin" ? "/admin" : "/seller", {
        replace: true,
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(251,146,60,0.25),_transparent_32%),linear-gradient(135deg,#fff7ed_0%,#fffbeb_45%,#ffffff_100%)] px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-orange-100 bg-white shadow-panel lg:grid-cols-[1.15fr_0.85fr]">
        <section className="hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-orange-300">
              Zamor Manager
            </p>
            <h1 className="mt-6 max-w-md text-4xl font-semibold leading-tight">
              Connecte ton espace de gestion et pilote tes ventes sans friction.
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-300">
              Interface de connexion sécurisée pour administrateurs et vendeurs.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-sm text-slate-300">Accès entreprise</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              Zamor Multi Services Accès
            </p>
            <div className="mt-6 h-2 rounded-full bg-white/10">
              <div className="h-2 w-2/3 rounded-full bg-orange-400" />
            </div>
          </div>
        </section>

        <section className="px-6 py-8 sm:px-10 sm:py-12">
          <div className="mx-auto max-w-md">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">
                Connexion
              </p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">
                Accéder à votre compte
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Saisissez votre email et votre mot de passe pour continuer.
              </p>
            </div>

            <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="exemple@email.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Votre mot de passe"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-100"
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
          </div>
        </section>
      </div>
    </main>
  );
}

export default LoginPage;
