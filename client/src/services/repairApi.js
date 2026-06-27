import { API_URL } from "./authApi";
import { jsonOrThrow } from "../utils/fetchUtils";

export const listRepairs = async ({ statut, search, page = 1, limit = 50 } = {}) => {
  const query = new URLSearchParams();
  if (statut) query.set("statut", statut);
  if (search) query.set("search", search);
  query.set("page", page);
  query.set("limit", limit);
  const res = await fetch(`${API_URL}/repairs?${query.toString()}`, { credentials: "include" });
  return jsonOrThrow(res, "Impossible de charger les réparations.");
};

export const getRepair = async (id) => {
  const res = await fetch(`${API_URL}/repairs/${id}`, { credentials: "include" });
  return jsonOrThrow(res, "Réparation introuvable.");
};

export const createRepair = async (payload) => {
  const res = await fetch(`${API_URL}/repairs`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res, "Impossible de créer la réparation.");
};

export const updateRepair = async (id, payload) => {
  const res = await fetch(`${API_URL}/repairs/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res, "Impossible de mettre à jour la réparation.");
};

export const deleteRepair = async (id) => {
  const res = await fetch(`${API_URL}/repairs/${id}`, { method: "DELETE", credentials: "include" });
  return jsonOrThrow(res, "Impossible de supprimer la réparation.");
};
