import { API_URL } from "./authApi";
import { jsonOrThrow } from "../utils/fetchUtils";

export const getLoginHistory = async ({ from, to, success, user_id, page = 1, limit = 50 } = {}) => {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  if (success !== undefined && success !== "") query.set("success", success);
  if (user_id) query.set("user_id", user_id);
  query.set("page", page);
  query.set("limit", limit);
  const res = await fetch(`${API_URL}/login-history?${query.toString()}`, { credentials: "include" });
  return jsonOrThrow(res, "Impossible de charger l'historique.");
};
