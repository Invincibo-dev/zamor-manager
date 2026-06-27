import { API_URL } from "./authApi";
import { jsonOrThrow } from "../utils/fetchUtils";

export const listClients = async ({ search, page = 1, limit = 50 } = {}) => {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  query.set("page", page);
  query.set("limit", limit);
  const res = await fetch(`${API_URL}/clients?${query.toString()}`, { credentials: "include" });
  return jsonOrThrow(res, "Impossible de charger les clients.");
};

export const getClient = async (id) => {
  const res = await fetch(`${API_URL}/clients/${id}`, { credentials: "include" });
  return jsonOrThrow(res, "Client introuvable.");
};

export const createClient = async (payload) => {
  const res = await fetch(`${API_URL}/clients`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res, "Impossible de créer le client.");
};

export const updateClient = async (id, payload) => {
  const res = await fetch(`${API_URL}/clients/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res, "Impossible de mettre à jour le client.");
};

export const deleteClient = async (id) => {
  const res = await fetch(`${API_URL}/clients/${id}`, { method: "DELETE", credentials: "include" });
  return jsonOrThrow(res, "Impossible de supprimer le client.");
};
