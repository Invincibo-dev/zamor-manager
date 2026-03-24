import { getStoredUser } from "../utils/auth";

const formatDate = () =>
  new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

function Topbar({ title, subtitle }) {
  const user = getStoredUser();

  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{subtitle}</p>
          <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Utilisateur
            </p>
            <p className="mt-1 font-semibold text-slate-900">{user?.name}</p>
          </div>
          <div className="rounded-full bg-orange-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
            {user?.role}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
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
