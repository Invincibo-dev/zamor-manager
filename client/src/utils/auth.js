const USER_KEY = "zamor_manager_user";

// Le token JWT est dans un cookie HttpOnly géré par le serveur.
// Seul le profil utilisateur est conservé en localStorage pour l'UI (nom, rôle).

export const saveSession = ({ user }) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(USER_KEY);
};

// Conservé pour éviter les erreurs d'import dans les fichiers existants.
// Le token n'est plus lisible depuis JavaScript.
export const getStoredToken = () => null;

export const getStoredUser = () => {
  const value = localStorage.getItem(USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    clearSession();
    return null;
  }
};

export const isAuthenticated = () => Boolean(getStoredUser());
