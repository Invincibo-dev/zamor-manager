import { API_URL } from "./authApi";
import { getStoredToken } from "../utils/auth";

const getAuthHeaders = () => {
  const token = getStoredToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const createSaleReceiptRequest = async (payload) => {
  const response = await fetch(`${API_URL}/sales`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to create sale receipt.");
  }

  return data;
};

export const getReceiptPdfUrl = (code) => {
  return `${API_URL}/sales/pdf/${encodeURIComponent(code)}`;
};

export const downloadReceiptPdf = async (code) => {
  const response = await fetch(getReceiptPdfUrl(code), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
    },
  });

  if (!response.ok) {
    let message = "Failed to download PDF.";

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep default message when response is not JSON.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const fileUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = fileUrl;
  link.download = `${code}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(fileUrl);
};

export const getSaleByCodeRequest = async (code) => {
  const response = await fetch(`${API_URL}/sales/code/${encodeURIComponent(code)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
    },
  });

  if (!response.ok) {
    let message = "Failed to load sale receipt.";

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep default message when response is not JSON.
    }

    throw new Error(message);
  }

  const data = await response.json();
  return data;
};

export const viewReceiptPdf = async (code) => {
  const response = await fetch(getReceiptPdfUrl(code), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
    },
  });

  if (!response.ok) {
    let message = "Failed to open PDF.";

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // Keep default message when response is not JSON.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const fileUrl = window.URL.createObjectURL(blob);
  window.open(fileUrl, "_blank", "noopener,noreferrer");
};

export const getAdminReport = async (period, queryString = "") => {
  const response = await fetch(`${API_URL}/reports/${period}${queryString}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load admin report.");
  }

  return data;
};

export const getSalesByDateRange = async ({ startDate, endDate }) => {
  const query = new URLSearchParams();

  if (startDate) {
    query.set("startDate", startDate);
  }

  if (endDate) {
    query.set("endDate", endDate);
  }

  const response = await fetch(`${API_URL}/sales?${query.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getStoredToken()}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load sales list.");
  }

  return data;
};
