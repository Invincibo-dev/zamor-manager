import { useEffect, useMemo, useState } from "react";

import AppShell from "../components/AppShell";
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
      <div className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.45)] sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Mot de passe
        </p>
        <h3 className="mt-3 text-xl font-semibold text-slate-950 sm:text-2xl">
          Changer le mot de passe
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
            placeholder="Nouveau mot de passe"
          />
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {submitting ? "Enregistrement..." : "Enregistrer"}
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

        setError(requestError.message || "Chargement impossible.");
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
        message: "Nom, email et mot de passe obligatoires.",
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
        message: `Vendeur ajoute : ${data.user.email}`,
      });
    } catch (requestError) {
      setToast({
        type: "error",
        message: requestError.message || "Creation impossible.",
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
        message: "Entre un nouveau mot de passe.",
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
        message: data.message || "Mot de passe change.",
      });
    } catch (requestError) {
      setToast({
        type: "error",
        message:
          requestError.message || "Changement impossible.",
      });
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <AppShell title="Utilisateurs" subtitle="Equipe">
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

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 sm:gap-6">
        <section className="rounded-[28px] bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:p-5 lg:p-6">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
              Nouveau vendeur
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
              Ajouter un vendeur
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Cree un compte vendeur en quelques secondes.
            </p>
          </div>

          <form
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]"
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
                placeholder="Nom"
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
                placeholder="Mot de passe"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={creatingSeller}
                className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingSeller ? "Creation..." : "Ajouter"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[28px] bg-white p-4 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)] sm:p-5 lg:p-6">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                Comptes
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950 sm:text-2xl">
                Liste des comptes
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Gere les vendeurs sans toucher au reste.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-950">{sellers.length}</span>{" "}
              vendeurs actifs
            </div>
          </div>

          {error ? (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}

          <div className="space-y-4 lg:hidden">
            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Chargement...
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Aucun utilisateur trouve.
              </div>
            ) : (
              users.map((user) => (
                <article
                  key={user.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                        Utilisateur
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-950">
                        {user.name}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                        user.role === "admin"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                        Email
                      </p>
                      <p className="mt-1 text-sm text-slate-700 break-all">
                        {user.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                        Cree le
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {formatDateTime(user.created_at)}
                      </p>
                    </div>
                  </div>

                  {user.role === "vendeur" ? (
                    <button
                      type="button"
                      onClick={() => handleOpenResetModal(user)}
                      className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Changer mot de passe
                    </button>
                  ) : null}
                </article>
              ))
            )}
          </div>

          <div className="hidden overflow-x-auto rounded-3xl border border-slate-200 lg:block">
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
                    <td colSpan="5" className="px-5 py-8 text-center text-sm text-slate-500">
                      Chargement...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr className="border-t border-slate-200">
                    <td colSpan="5" className="px-5 py-8 text-center text-sm text-slate-500">
                      Aucun utilisateur trouve.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-t border-slate-200 text-sm text-slate-700"
                    >
                      <td className="p-4 font-semibold text-slate-900">{user.name}</td>
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
                            Changer mot de passe
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
    </AppShell>
  );
}

export default Users;
