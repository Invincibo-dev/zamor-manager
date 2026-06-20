import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { getCompanySettings } from "../services/companyApi";
import { getStoredToken } from "../utils/auth";

const CompanyContext = createContext(null);

export function CompanyProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getStoredToken()) {
      setLoading(false);
      return;
    }
    try {
      const data = await getCompanySettings();
      setSettings(data.settings);
    } catch {
      // Silently fail — l'app fonctionne même sans les settings
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <CompanyContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
