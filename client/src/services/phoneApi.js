import { API_URL } from "./authApi";
import { jsonOrThrow } from "../utils/fetchUtils";

export const listPhones = async ({ statut, search, page = 1, limit = 50 } = {}) => {
  const query = new URLSearchParams();
  if (statut) query.set("statut", statut);
  if (search) query.set("search", search);
  query.set("page", page);
  query.set("limit", limit);
  const res = await fetch(`${API_URL}/phones?${query.toString()}`, { credentials: "include" });
  return jsonOrThrow(res, "Impossible de charger les téléphones.");
};

export const getPhone = async (id) => {
  const res = await fetch(`${API_URL}/phones/${id}`, { credentials: "include" });
  return jsonOrThrow(res, "Téléphone introuvable.");
};

export const createPhone = async (payload) => {
  const res = await fetch(`${API_URL}/phones`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res, "Impossible de créer le téléphone.");
};

export const updatePhone = async (id, payload) => {
  const res = await fetch(`${API_URL}/phones/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res, "Impossible de mettre à jour le téléphone.");
};

export const deletePhone = async (id) => {
  const res = await fetch(`${API_URL}/phones/${id}`, { method: "DELETE", credentials: "include" });
  return jsonOrThrow(res, "Impossible de supprimer le téléphone.");
};
