import { getStoredUser } from "../utils/auth";

const formatDate = () =>
  new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

function Topbar({ title, subtitle, onMenuClick, compact = false }) {
  const user = getStoredUser();

  return (
    <header className="border-b border-slate-200 bg-white px-3 py-3 sm:px-4 md:px-5 lg:px-8 lg:py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="mt-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 lg:hidden"
            aria-label="Ouvrir le menu"
          >
            ≡
          </button>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
              {subtitle}
            </p>
            <h2
              className={`truncate font-semibold text-slate-950 ${
                compact ? "text-xl sm:text-2xl" : "text-xl sm:text-2xl lg:text-3xl"
              }`}
            >
              {title}
            </h2>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
              Utilisateur
            </p>
            <p className="mt-1 font-semibold text-slate-900">{user?.name}</p>
          </div>
          <div className="rounded-full bg-orange-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-700">
            {user?.role}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm xl:block hidden">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
              Date actuelle
            </p>
            <p className="mt-1 font-semibold text-slate-900">{formatDate()}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
