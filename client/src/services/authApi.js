import { API_URL, requestJson } from "./http";

export const loginRequest = ({ email, password }) =>
  requestJson("/auth/login", {
    method: "POST",
    body: { email, password },
    authenticated: false,
    errorMessage: "Login failed.",
  });

export { API_URL };
