import { API_URL } from "./authApi";
import { getStoredToken } from "../utils/auth";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getStoredToken()}`,
});

export const getUsersRequest = async () => {
  const response = await fetch(`${API_URL}/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
    },
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
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Impossible de reinitialiser le mot de passe.");
  }

  return data;
};
