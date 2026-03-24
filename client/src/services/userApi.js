import { requestJson } from "./http";

export const getUsersRequest = () =>
  requestJson("/users", {
    errorMessage: "Impossible de charger les utilisateurs.",
  });
