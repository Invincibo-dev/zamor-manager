import { API_URL } from "./authApi";
import { jsonOrThrow } from "../utils/fetchUtils";

export const getUsersRequest = async () => {
  const res = await fetch(`${API_URL}/users`, { credentials: "include" });
  return jsonOrThrow(res, "Impossible de charger les utilisateurs.");
};

export const createSellerRequest = async (payload) => {
  const res = await fetch(`${API_URL}/users/create-seller`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res, "Impossible de créer le vendeur.");
};

export const resetSellerPasswordRequest = async (id, payload) => {
  const res = await fetch(`${API_URL}/users/${id}/reset-password`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res, "Impossible de réinitialiser le mot de passe.");
};
