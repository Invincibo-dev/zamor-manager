import { API_URL } from "./authApi";
import { jsonOrThrow, redirect401 } from "../utils/fetchUtils";

export const createRecharge = async (payload) => {
  const res = await fetch(`${API_URL}/recharges`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res, "Impossible de créer la recharge.");
};

export const listRecharges = async ({ from, to, company, page = 1, limit = 50 } = {}) => {
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  if (company) q.set("company", company);
  q.set("page", page);
  q.set("limit", limit);
  const res = await fetch(`${API_URL}/recharges?${q.toString()}`, { credentials: "include" });
  return jsonOrThrow(res, "Impossible de charger les recharges.");
};

export const getRechargesPdfUrl = (code) => `${API_URL}/recharges/pdf/${encodeURIComponent(code)}`;

export const downloadRechargePdf = async (code) => {
  const res = await fetch(getRechargesPdfUrl(code), { credentials: "include" });
  if (!res.ok) { redirect401(res.status); throw new Error("PDF introuvable."); }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
};
