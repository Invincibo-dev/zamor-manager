import { API_URL } from "./authApi";
import { jsonOrThrow } from "../utils/fetchUtils";

export const listDebts = async ({ statut, client_id, search, page = 1, limit = 50 } = {}) => {
  const query = new URLSearchParams();
  if (statut) query.set("statut", statut);
  if (client_id) query.set("client_id", client_id);
  if (search) query.set("search", search);
  query.set("page", page);
  query.set("limit", limit);
  const res = await fetch(`${API_URL}/debts?${query.toString()}`, { credentials: "include" });
  return jsonOrThrow(res, "Impossible de charger les dettes.");
};

export const getDebt = async (id) => {
  const res = await fetch(`${API_URL}/debts/${id}`, { credentials: "include" });
  return jsonOrThrow(res, "Dette introuvable.");
};

export const createDebt = async (payload) => {
  const res = await fetch(`${API_URL}/debts`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res, "Impossible de créer la dette.");
};

export const addDebtPayment = async (debtId, payload) => {
  const res = await fetch(`${API_URL}/debts/${debtId}/payments`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res, "Impossible d'enregistrer le paiement.");
};

export const updateDebt = async (id, payload) => {
  const res = await fetch(`${API_URL}/debts/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res, "Impossible de mettre à jour la dette.");
};

export const deleteDebt = async (id) => {
  const res = await fetch(`${API_URL}/debts/${id}`, { method: "DELETE", credentials: "include" });
  return jsonOrThrow(res, "Impossible de supprimer la dette.");
};
