import { API_URL } from "./api";
import { getStoredToken } from "../utils/auth";

const authHeaders = () => ({
  Authorization: `Bearer ${getStoredToken()}`,
});

export const getCompanySettings = async () => {
  const res = await fetch(`${API_URL}/company-settings`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Erreur lors du chargement des paramètres.");
  }
  return res.json();
};

export const updateCompanySettings = async (formData) => {
  const res = await fetch(`${API_URL}/company-settings`, {
    method: "PUT",
    // Pas de Content-Type : le navigateur le définit automatiquement avec le boundary multipart
    headers: authHeaders(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Erreur lors de la sauvegarde.");
  return data;
};
