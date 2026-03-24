const TOKEN_KEY = "zamor_manager_token";
const USER_KEY = "zamor_manager_user";

export const saveSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

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

export const isAuthenticated = () => Boolean(getStoredToken() && getStoredUser());
