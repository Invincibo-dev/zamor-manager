import { clearSession } from "../utils/auth";
import { redirect401 } from "../utils/fetchUtils";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const buildHeaders = (includeJson = true) => {
  const headers = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

const handleResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        clearSession();
        redirect401(401);
      }

      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  if (!response.ok) {
    throw new Error("Request failed.");
  }

  return response;
};

export const loginRequest = async (payload) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

export const logoutRequest = async () => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  clearSession();

  return handleResponse(response);
};

export const getProfile = async () => {
  const response = await fetch(`${API_URL}/auth/me`, {
    credentials: "include",
    headers: buildHeaders(false),
  });

  return handleResponse(response);
};

export const getReport = async (period, query = "") => {
  const response = await fetch(`${API_URL}/reports/${period}${query}`, {
    credentials: "include",
    headers: buildHeaders(false),
  });

  return handleResponse(response);
};

export const getSales = async (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.append(key, value);
    }
  });

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await fetch(`${API_URL}/sales${suffix}`, {
    credentials: "include",
    headers: buildHeaders(false),
  });

  return handleResponse(response);
};

export const createSale = async (payload) => {
  const response = await fetch(`${API_URL}/sales`, {
    method: "POST",
    credentials: "include",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

export const getSalePdfUrl = (code) => `${API_URL}/sales/pdf/${encodeURIComponent(code)}`;

export const openPdf = async (code) => {
  const response = await fetch(getSalePdfUrl(code), {
    credentials: "include",
    headers: buildHeaders(false),
  });

  if (!response.ok) {
    throw new Error("Unable to open PDF.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
};

export const downloadPdf = async (code) => {
  const response = await fetch(getSalePdfUrl(code), {
    credentials: "include",
    headers: buildHeaders(false),
  });

  if (!response.ok) {
    throw new Error("Unable to download PDF.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${code}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const printPdf = async (code) => {
  const response = await fetch(getSalePdfUrl(code), {
    credentials: "include",
    headers: buildHeaders(false),
  });

  if (!response.ok) {
    throw new Error("Unable to print PDF.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");

  if (!printWindow) {
    throw new Error("Popup blocked. Allow popups to print.");
  }

  printWindow.onload = () => {
    printWindow.print();
  };
};

export { API_URL };
