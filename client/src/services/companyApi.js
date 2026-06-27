import { API_URL } from "./api";
import { jsonOrThrow, redirect401 } from "../utils/fetchUtils";

export const getCompanySettings = async () => {
  const res = await fetch(`${API_URL}/company-settings`, { credentials: "include" });
  return jsonOrThrow(res, "Erreur lors du chargement des paramètres.");
};

export const updateCompanySettings = async (formData) => {
  const res = await fetch(`${API_URL}/company-settings`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });
  return jsonOrThrow(res, "Erreur lors de la sauvegarde.");
};
