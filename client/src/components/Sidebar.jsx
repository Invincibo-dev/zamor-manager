import { NavLink } from "react-router-dom";

import { clearSession } from "../utils/auth";

const menuItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Ventes", to: "/dashboard" },
  { label: "Créer fiche", to: "/create-sale" },
  { label: "Rapports", to: "/reports" },
  { label: "Utilisateurs", to: "/users" },
];

function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-64 shrink-0 border-r border-slate-200 bg-slate-950 px-5 py-8 text-white lg:flex lg:flex-col lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.45em] text-orange-300">
          Zamor Manager
        </p>
        <h1 className="mt-4 text-2xl font-semibold">SaaS Console</h1>

        <nav className="mt-10 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-sm font-medium transition ${
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
        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/10"
      >
        Déconnexion
      </button>
    </aside>
  );
}

export default Sidebar;
