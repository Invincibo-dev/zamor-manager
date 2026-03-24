import { clearSession, getStoredToken } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const buildHeaders = (includeJson = true) => {
  const headers = {};

  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }

  const token = getStoredToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
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
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

export const getProfile = async () => {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: buildHeaders(false),
  });

  return handleResponse(response);
};

export const getReport = async (period, query = "") => {
  const response = await fetch(`${API_URL}/reports/${period}${query}`, {
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
    headers: buildHeaders(false),
  });

  return handleResponse(response);
};

export const createSale = async (payload) => {
  const response = await fetch(`${API_URL}/sales`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

export const getSalePdfUrl = (code) => `${API_URL}/sales/pdf/${encodeURIComponent(code)}`;

export const openPdf = (code) => {
  const token = getStoredToken();
  window.open(`${getSalePdfUrl(code)}?token=${encodeURIComponent(token || "")}`, "_blank");
};

export const downloadPdf = async (code) => {
  const response = await fetch(getSalePdfUrl(code), {
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
