import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AppShell({
  title,
  subtitle,
  children,
  posMode = false,
  contentClassName = "",
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("pos-mode", posMode);

    return () => {
      document.body.classList.remove("pos-mode");
    };
  }, [posMode]);

  return (
    <main className={`min-h-screen bg-[#f5f7fb] text-slate-900 ${posMode ? "pos-mode" : ""}`}>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={() => setMobileMenuOpen(false)}
          className={`fixed inset-0 z-40 bg-slate-950/50 transition-opacity lg:hidden ${
            mobileMenuOpen
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            title={title}
            subtitle={subtitle}
            compact={posMode}
            onMenuClick={() => setMobileMenuOpen(true)}
          />

          <section
            className={`flex-1 px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-5 lg:px-8 lg:py-6 ${
              posMode ? "overflow-y-auto pb-28 lg:pb-6" : ""
            } ${contentClassName}`}
          >
            {children}
          </section>
        </div>
      </div>
    </main>
  );
}

export default AppShell;
