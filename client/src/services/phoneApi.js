import { API_URL } from "./authApi";

export const listPhones = async ({ statut, search, page = 1, limit = 50 } = {}) => {
  const query = new URLSearchParams();

  if (statut) query.set("statut", statut);
  if (search) query.set("search", search);
  query.set("page", page);
  query.set("limit", limit);

  const res = await fetch(`${API_URL}/phones?${query.toString()}`, {
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Impossible de charger les téléphones.");

  return data;
};

export const getPhone = async (id) => {
  const res = await fetch(`${API_URL}/phones/${id}`, {
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Téléphone introuvable.");

  return data;
};

export const createPhone = async (payload) => {
  const res = await fetch(`${API_URL}/phones`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Impossible de créer le téléphone.");

  return data;
};

export const updatePhone = async (id, payload) => {
  const res = await fetch(`${API_URL}/phones/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Impossible de mettre à jour le téléphone.");

  return data;
};

export const deletePhone = async (id) => {
  const res = await fetch(`${API_URL}/phones/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Impossible de supprimer le téléphone.");

  return data;
};
