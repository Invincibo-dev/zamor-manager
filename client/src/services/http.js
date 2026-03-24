import { clearSession, getStoredToken } from "../utils/auth";

export const API_URL = import.meta.env.VITE_API_URL || "/api";

export const buildApiUrl = (path) => `${API_URL}${path}`;

export const buildHeaders = ({
  includeJson = true,
  authenticated = true,
} = {}) => {
  const headers = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  if (authenticated) {
    const token = getStoredToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

const parseErrorResponse = async (response, fallbackMessage) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json();

    if (response.status === 401) {
      clearSession();
    }

    throw new Error(data.message || fallbackMessage);
  }

  if (response.status === 401) {
    clearSession();
  }

  throw new Error(fallbackMessage);
};

export const requestJson = async (
  path,
  {
    method = "GET",
    body,
    query,
    authenticated = true,
    includeJson = true,
    errorMessage = "Request failed.",
  } = {}
) => {
  const queryParams = query ? new URLSearchParams(query).toString() : "";
  const queryString = queryParams ? `?${queryParams}` : "";
  const response = await fetch(buildApiUrl(`${path}${queryString}`), {
    method,
    headers: buildHeaders({ includeJson, authenticated }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    return parseErrorResponse(response, errorMessage);
  }

  return response.json();
};

export const requestBlob = async (
  path,
  {
    method = "GET",
    authenticated = true,
    errorMessage = "Request failed.",
  } = {}
) => {
  const response = await fetch(buildApiUrl(path), {
    method,
    headers: buildHeaders({ includeJson: false, authenticated }),
  });

  if (!response.ok) {
    await parseErrorResponse(response, errorMessage);
  }

  return response.blob();
};

export const openBlobInNewTab = (blob) => {
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  return url;
};

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
