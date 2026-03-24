import { useEffect, useMemo, useState } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import {
  createSellerRequest,
  getUsersRequest,
  resetSellerPasswordRequest,
} from "../services/userApi";

const formatDateTime = (value) =>
  new Date(value).toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function Toast({ toast, onClose }) {
  if (!toast) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 w-full max-w-sm">
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

function ResetPasswordModal({
  user,
  newPassword,
  onChange,
  onClose,
  onSubmit,
  submitting,
}) {
  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 px-4">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Reset password
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-slate-950">
          Reinitialiser le mot de passe
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Nouveau mot de passe pour <span className="font-semibold">{user.name}</span>.
        </p>

        <div className="mt-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder="Entrez le nouveau mot de passe"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Mise a jour..." : "Valider"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [creatingSeller, setCreatingSeller] = useState(false);
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await getUsersRequest();

        if (!isMounted) {
          return;
        }

        setUsers(data.users || []);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(requestError.message || "Impossible de charger les utilisateurs.");
      } finally {
        if (!isMounted) {
          return;
        }

        setLoading(false);
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const sellers = useMemo(
    () => users.filter((user) => user.role === "vendeur"),
    [users]
  );

  const handleCreateSeller = async (event) => {
    event.preventDefault();
    setError("");
    setToast(null);

    if (!createForm.name || !createForm.email || !createForm.password) {
      setToast({
        type: "error",
        message: "Nom, email et mot de passe sont obligatoires.",
      });
      return;
    }

    setCreatingSeller(true);

    try {
      const data = await createSellerRequest(createForm);
      setUsers((currentUsers) => [data.user, ...currentUsers]);
      setCreateForm({
        name: "",
        email: "",
        password: "",
      });
      setToast({
        type: "success",
        message: `Vendeur cree : ${data.user.email}`,
      });
    } catch (requestError) {
      setToast({
        type: "error",
        message: requestError.message || "Impossible de creer le vendeur.",
      });
    } finally {
      setCreatingSeller(false);
    }
  };

  const handleOpenResetModal = (user) => {
    setResetModalUser(user);
    setNewPassword("");
    setToast(null);
  };

  const handleResetPassword = async () => {
    if (!resetModalUser) {
      return;
    }

    if (!newPassword) {
      setToast({
        type: "error",
        message: "Le nouveau mot de passe est obligatoire.",
      });
      return;
    }

    setResettingPassword(true);

    try {
      const data = await resetSellerPasswordRequest(resetModalUser.id, {
        newPassword,
      });
      setResetModalUser(null);
      setNewPassword("");
      setToast({
        type: "success",
        message: data.message || "Mot de passe reinitialise avec succes.",
      });
    } catch (requestError) {
      setToast({
        type: "error",
        message:
          requestError.message || "Impossible de reinitialiser le mot de passe.",
      });
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <ResetPasswordModal
        user={resetModalUser}
        newPassword={newPassword}
        onChange={setNewPassword}
        onClose={() => {
          setResetModalUser(null);
          setNewPassword("");
        }}
        onSubmit={handleResetPassword}
        submitting={resettingPassword}
      />

      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title="Utilisateurs" subtitle="Gestion des acces" />

          <section className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
              <section className="rounded-[28px] bg-white p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)]">
                <div className="mb-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                    Creation vendeur
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                    Ajouter un nouveau vendeur
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Cette action utilise l'endpoint admin `POST /api/users/create-seller`.
                  </p>
                </div>

                <form
                  className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]"
                  onSubmit={handleCreateSeller}
                >
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      placeholder="Nom du vendeur"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      placeholder="vendeur@zamor.local"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(event) =>
                        setCreateForm((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      placeholder="Mot de passe initial"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={creatingSeller}
                      className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {creatingSeller ? "Creation..." : "Creer"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="rounded-[28px] bg-white p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)]">
                <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                      Equipe
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                      Liste des utilisateurs
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Vue admin des comptes enregistres dans Zamor Manager.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-950">{sellers.length}</span>{" "}
                    vendeurs enregistres
                  </div>
                </div>

                {error ? (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full min-w-[920px] border-collapse">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-4 text-left text-sm font-semibold text-slate-600">
                          Nom
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-slate-600">
                          Email
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-slate-600">
                          Role
                        </th>
                        <th className="p-4 text-left text-sm font-semibold text-slate-600">
                          Cree le
                        </th>
                        <th className="p-4 text-center text-sm font-semibold text-slate-600">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr className="border-t border-slate-200">
                          <td
                            colSpan="5"
                            className="px-5 py-8 text-center text-sm text-slate-500"
                          >
                            Chargement des utilisateurs...
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr className="border-t border-slate-200">
                          <td
                            colSpan="5"
                            className="px-5 py-8 text-center text-sm text-slate-500"
                          >
                            Aucun utilisateur trouve.
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr
                            key={user.id}
                            className="border-t border-slate-200 text-sm text-slate-700"
                          >
                            <td className="p-4 font-semibold text-slate-900">
                              {user.name}
                            </td>
                            <td className="p-4">{user.email}</td>
                            <td className="p-4">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                                  user.role === "admin"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {user.role}
                              </span>
                            </td>
                            <td className="p-4">{formatDateTime(user.created_at)}</td>
                            <td className="p-4 text-center">
                              {user.role === "vendeur" ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenResetModal(user)}
                                  className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                                >
                                  Reset password
                                </button>
                              ) : (
                                <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                                  -
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Users;
