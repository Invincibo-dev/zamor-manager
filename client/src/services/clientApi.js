import { API_URL } from "./authApi";

export const listClients = async ({ search, page = 1, limit = 50 } = {}) => {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  query.set("page", page);
  query.set("limit", limit);

  const res = await fetch(`${API_URL}/clients?${query.toString()}`, {
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Impossible de charger les clients.");
  return data;
};

export const getClient = async (id) => {
  const res = await fetch(`${API_URL}/clients/${id}`, { credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Client introuvable.");
  return data;
};

export const createClient = async (payload) => {
  const res = await fetch(`${API_URL}/clients`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Impossible de créer le client.");
  return data;
};

export const updateClient = async (id, payload) => {
  const res = await fetch(`${API_URL}/clients/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Impossible de mettre à jour le client.");
  return data;
};

export const deleteClient = async (id) => {
  const res = await fetch(`${API_URL}/clients/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Impossible de supprimer le client.");
  return data;
};
