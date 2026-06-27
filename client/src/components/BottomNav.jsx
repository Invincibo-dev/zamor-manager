import { NavLink } from "react-router-dom";

import { logoutRequest } from "../services/api";
import { getStoredUser } from "../utils/auth";

const handleLogout = async () => {
  try {
    await logoutRequest();
  } finally {
    window.location.href = "/login";
  }
};

const ADMIN_ITEMS = [
  { label: "Accueil", to: "/dashboard" },
  { label: "Vendre", to: "/create-sale" },
  { label: "Téléphones", to: "/phones" },
  { label: "Clients", to: "/clients" },
  { label: "Comptes", to: "/users" },
];

const GESTIONNAIRE_ITEMS = [
  { label: "Accueil", to: "/dashboard" },
  { label: "Vendre", to: "/create-sale" },
  { label: "Téléphones", to: "/phones" },
  { label: "Clients", to: "/clients" },
  { label: "Finances", to: "/finances" },
];

function NavGrid({ items }) {
  return (
    <nav className="border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid grid-cols-5 gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-h-[56px] items-center justify-center rounded-2xl px-2 text-center text-xs font-semibold transition ${
                isActive ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function BottomNav() {
  const user = getStoredUser();
  const role = user?.role;

  if (role === "admin") return <NavGrid items={ADMIN_ITEMS} />;
  if (role === "gestionnaire") return <NavGrid items={GESTIONNAIRE_ITEMS} />;


  return (
    <nav className="border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-sm grid-cols-2 gap-2">
        <NavLink
          to="/create-sale"
          className={({ isActive }) =>
            `flex min-h-[56px] items-center justify-center rounded-2xl px-2 text-center text-xs font-semibold transition ${
              isActive ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600"
            }`
          }
        >
          Vendre
        </NavLink>
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-[56px] items-center justify-center rounded-2xl bg-slate-100 px-2 text-center text-xs font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-600"
        >
          Deconnexion
        </button>
      </div>
    </nav>
  );
}

export default BottomNav;
