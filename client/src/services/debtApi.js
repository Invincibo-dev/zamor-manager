import { API_URL } from "./authApi";

export const listDebts = async ({ statut, client_id, search, page = 1, limit = 50 } = {}) => {
  const query = new URLSearchParams();
  if (statut) query.set("statut", statut);
  if (client_id) query.set("client_id", client_id);
  if (search) query.set("search", search);
  query.set("page", page);
  query.set("limit", limit);

  const res = await fetch(`${API_URL}/debts?${query.toString()}`, { credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Impossible de charger les dettes.");
  return data;
};

export const getDebt = async (id) => {
  const res = await fetch(`${API_URL}/debts/${id}`, { credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Dette introuvable.");
  return data;
};

export const createDebt = async (payload) => {
  const res = await fetch(`${API_URL}/debts`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Impossible de créer la dette.");
  return data;
};

export const addDebtPayment = async (debtId, payload) => {
  const res = await fetch(`${API_URL}/debts/${debtId}/payments`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Impossible d'enregistrer le paiement.");
  return data;
};

export const updateDebt = async (id, payload) => {
  const res = await fetch(`${API_URL}/debts/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Impossible de mettre à jour la dette.");
  return data;
};

export const deleteDebt = async (id) => {
  const res = await fetch(`${API_URL}/debts/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Impossible de supprimer la dette.");
  return data;
};
