import { API_URL } from "./authApi";

export const listRepairs = async ({ statut, search, page = 1, limit = 50 } = {}) => {
  const query = new URLSearchParams();

  if (statut) query.set("statut", statut);
  if (search) query.set("search", search);
  query.set("page", page);
  query.set("limit", limit);

  const res = await fetch(`${API_URL}/repairs?${query.toString()}`, {
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Impossible de charger les réparations.");

  return data;
};

export const getRepair = async (id) => {
  const res = await fetch(`${API_URL}/repairs/${id}`, {
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Réparation introuvable.");

  return data;
};

export const createRepair = async (payload) => {
  const res = await fetch(`${API_URL}/repairs`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Impossible de créer la réparation.");

  return data;
};

export const updateRepair = async (id, payload) => {
  const res = await fetch(`${API_URL}/repairs/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Impossible de mettre à jour la réparation.");

  return data;
};

export const deleteRepair = async (id) => {
  const res = await fetch(`${API_URL}/repairs/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Impossible de supprimer la réparation.");

  return data;
};
