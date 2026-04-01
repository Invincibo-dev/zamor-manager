import { NavLink } from "react-router-dom";

import { getStoredUser } from "../utils/auth";

function BottomNav() {
  const user = getStoredUser();
  const isAdmin = user?.role === "admin";

  const items = isAdmin
    ? [
        { label: "Accueil", to: "/dashboard" },
        { label: "Vendre", to: "/create-sale" },
        { label: "Rapports", to: "/reports" },
        { label: "Comptes", to: "/users" },
      ]
    : [{ label: "Vendre", to: "/create-sale" }];

  return (
    <nav className="border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
      <div
        className={`mx-auto grid gap-2 ${
          items.length === 1 ? "max-w-sm grid-cols-1" : "grid-cols-4"
        }`}
      >
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-h-[56px] items-center justify-center rounded-2xl px-2 text-center text-xs font-semibold transition ${
                isActive
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600"
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

export default BottomNav;
