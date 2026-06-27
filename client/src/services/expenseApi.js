import { API_URL } from "./authApi";
import { jsonOrThrow, redirect401 } from "../utils/fetchUtils";

export const listExpenses = async ({ from, to, categorie, page = 1, limit = 100 } = {}) => {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  if (categorie) query.set("categorie", categorie);
  query.set("page", page);
  query.set("limit", limit);
  const res = await fetch(`${API_URL}/expenses?${query.toString()}`, { credentials: "include" });
  return jsonOrThrow(res, "Impossible de charger les dépenses.");
};

export const getFinanceSummary = async ({ from, to }) => {
  const query = new URLSearchParams({ from, to });
  const res = await fetch(`${API_URL}/expenses/summary?${query.toString()}`, { credentials: "include" });
  return jsonOrThrow(res, "Impossible de charger le résumé financier.");
};

export const createExpense = async (payload) => {
  const res = await fetch(`${API_URL}/expenses`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res, "Impossible de créer la dépense.");
};

export const updateExpense = async (id, payload) => {
  const res = await fetch(`${API_URL}/expenses/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res, "Impossible de modifier la dépense.");
};

export const downloadExpensesCsv = async ({ from, to }) => {
  const query = new URLSearchParams({ from, to });
  const res = await fetch(`${API_URL}/expenses/export?${query.toString()}`, { credentials: "include" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    redirect401(res.status);
    throw new Error(data.message || "Export impossible.");
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `depenses_${from}_${to}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const deleteExpense = async (id) => {
  const res = await fetch(`${API_URL}/expenses/${id}`, { method: "DELETE", credentials: "include" });
  return jsonOrThrow(res, "Impossible de supprimer la dépense.");
};
