import { API_URL } from "./authApi";
import { jsonOrThrow, redirect401 } from "../utils/fetchUtils";

export const createNatcash = async (payload) => {
  const res = await fetch(`${API_URL}/natcash`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res, "Impossible de créer la transaction Natcash.");
};

export const listNatcash = async ({ from, to, service_type, page = 1, limit = 50 } = {}) => {
  const q = new URLSearchParams();
  if (from) q.set("from", from);
  if (to) q.set("to", to);
  if (service_type) q.set("service_type", service_type);
  q.set("page", page);
  q.set("limit", limit);
  const res = await fetch(`${API_URL}/natcash?${q.toString()}`, { credentials: "include" });
  return jsonOrThrow(res, "Impossible de charger les transactions Natcash.");
};

export const getNatcashPdfUrl = (code) => `${API_URL}/natcash/pdf/${encodeURIComponent(code)}`;

export const downloadNatcashPdf = async (code) => {
  const res = await fetch(getNatcashPdfUrl(code), { credentials: "include" });
  if (!res.ok) { redirect401(res.status); throw new Error("PDF introuvable."); }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
};
