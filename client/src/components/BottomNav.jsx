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
  { label: "Natcash", to: "/natcash" },
  { label: "Recharges", to: "/recharges" },
  { label: "Comptes", to: "/users" },
];

const GESTIONNAIRE_ITEMS = [
  { label: "Accueil", to: "/dashboard" },
  { label: "Vendre", to: "/create-sale" },
  { label: "Natcash", to: "/natcash" },
  { label: "Recharges", to: "/recharges" },
  { label: "Finances", to: "/finances" },
];

const VENDEUR_ITEMS = [
  { label: "Vendre", to: "/create-sale" },
  { label: "Natcash", to: "/natcash" },
  { label: "Recharges", to: "/recharges" },
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

  return <NavGrid items={VENDEUR_ITEMS} />;
}

export default BottomNav;
