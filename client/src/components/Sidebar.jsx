import { NavLink } from "react-router-dom";

import { clearSession, getStoredUser } from "../utils/auth";

function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const user = getStoredUser();
  const isAdmin = user?.role === "admin";
  const menuItems = isAdmin
    ? [
        { label: "Tableau de bord", to: "/dashboard" },
        { label: "Nouvelle vente", to: "/create-sale" },
        { label: "Rapports", to: "/reports" },
        { label: "Utilisateurs", to: "/users" },
      ]
    : [{ label: "Nouvelle vente", to: "/create-sale" }];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[260px] flex-col justify-between border-r border-white/10 bg-slate-950 px-4 py-6 text-white shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:min-h-screen lg:w-64 lg:translate-x-0 lg:border-r lg:border-slate-200 lg:px-5 lg:py-8 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div>
        <div className="flex items-center justify-between lg:block">
          <div>
            <p className="text-[11px] uppercase tracking-[0.42em] text-orange-300">
              Zamor Manager
            </p>
            <h1 className="mt-3 text-xl font-semibold lg:text-2xl">
              Espace vente
            </h1>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 lg:hidden"
          >
            Fermer
          </button>
        </div>

        <nav className="mt-8 space-y-2 lg:mt-10">
          {menuItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `block rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-orange-500 text-white"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <button
        type="button"
        onClick={() => {
          clearSession();
          window.location.href = "/login";
        }}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10"
      >
        Deconnexion
      </button>
    </aside>
  );
}

export default Sidebar;
