import { API_URL } from "./authApi";
import { getStoredToken } from "../utils/auth";

export const getUsersRequest = async () => {
  const response = await fetch(`${API_URL}/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Impossible de charger les utilisateurs.");
  }

  return data;
};
