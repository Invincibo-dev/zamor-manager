import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { getUsersRequest } from "../services/userApi";

const formatDateTime = (value) =>
  new Date(value).toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar title="Utilisateurs" subtitle="Gestion des accès" />

          <section className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <section className="rounded-xl bg-white p-6 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.22)]">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Equipe
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                  Liste des utilisateurs
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Vue admin des comptes enregistrés dans Zamor Manager.
                </p>
              </div>

              {error ? (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[720px] border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-4 text-left text-sm font-semibold text-slate-600">
                        Nom
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-600">
                        Email
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-600">
                        Rôle
                      </th>
                      <th className="p-4 text-left text-sm font-semibold text-slate-600">
                        Créé le
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr className="border-t border-slate-200">
                        <td
                          colSpan="4"
                          className="px-5 py-8 text-center text-sm text-slate-500"
                        >
                          Chargement des utilisateurs...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr className="border-t border-slate-200">
                        <td
                          colSpan="4"
                          className="px-5 py-8 text-center text-sm text-slate-500"
                        >
                          Aucun utilisateur trouvé.
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
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Users;
