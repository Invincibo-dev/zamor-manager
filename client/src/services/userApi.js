import { API_URL } from "./authApi";

export const getUsersRequest = async () => {
  const response = await fetch(`${API_URL}/users`, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Impossible de charger les utilisateurs.");
  }

  return data;
};

export const createSellerRequest = async (payload) => {
  const response = await fetch(`${API_URL}/users/create-seller`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Impossible de creer le vendeur.");
  }

  return data;
};

export const resetSellerPasswordRequest = async (id, payload) => {
  const response = await fetch(`${API_URL}/users/${id}/reset-password`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Impossible de reinitialiser le mot de passe.");
  }

  return data;
};
