import { NavLink } from "react-router-dom";

import { clearSession, getStoredUser } from "../utils/auth";

const handleLogout = () => {
  clearSession();
  window.location.href = "/login";
};

function BottomNav() {
  const user = getStoredUser();
  const isAdmin = user?.role === "admin";

  const adminItems = [
    { label: "Accueil", to: "/dashboard" },
    { label: "Vendre", to: "/create-sale" },
    { label: "Rapports", to: "/reports" },
    { label: "Comptes", to: "/users" },
  ];

  if (isAdmin) {
    return (
      <nav className="border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid grid-cols-4 gap-2">
          {adminItems.map((item) => (
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
