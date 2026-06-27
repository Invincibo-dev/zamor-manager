const USER_KEY = "zamor_manager_user";

export const redirect401 = (status) => {
  if (status === 401) {
    localStorage.removeItem(USER_KEY);
    window.location.replace("/login");
  }
};

export const jsonOrThrow = async (res, defaultMsg = "Erreur serveur.") => {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    redirect401(res.status);
    throw new Error(data.message || defaultMsg);
  }
  return data;
};
