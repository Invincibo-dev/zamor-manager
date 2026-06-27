import { API_URL } from "./authApi";

export const createSaleReceiptRequest = async (payload) => {
  const response = await fetch(`${API_URL}/sales`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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
    credentials: "include",
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
    credentials: "include",
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
    credentials: "include",
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
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load admin report.");
  }

  return data;
};

export const getSalesByDateRange = async ({
  startDate,
  endDate,
  vendeurId,
  modePaiement,
  minMontant,
  maxMontant,
  search,
  page,
  limit,
} = {}) => {
  const query = new URLSearchParams();

  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
  if (vendeurId) query.set("vendeurId", vendeurId);
  if (modePaiement) query.set("modePaiement", modePaiement);
  if (minMontant) query.set("minMontant", minMontant);
  if (maxMontant) query.set("maxMontant", maxMontant);
  if (search) query.set("search", search);
  if (page) query.set("page", page);
  if (limit) query.set("limit", limit);

  const response = await fetch(`${API_URL}/sales?${query.toString()}`, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load sales list.");
  }

  return data;
};

export const downloadCsvExport = async ({ startDate, endDate }) => {
  const query = new URLSearchParams({ startDate, endDate });

  const response = await fetch(`${API_URL}/reports/export?${query.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) {
    let message = "Export impossible.";

    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      // keep default
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const fileUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = fileUrl;
  link.download = `ventes_${startDate}_${endDate}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(fileUrl);
};

export const getDashboard = async () => {
  const response = await fetch(`${API_URL}/dashboard`, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Chargement du dashboard impossible.");
  }

  return data;
};

export const getDashboardChartData = async () => {
  const response = await fetch(`${API_URL}/reports/chart-data`, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load chart data.");
  }

  return data;
};

export const getPaymentBreakdown = async ({ startDate, endDate } = {}) => {
  const query = new URLSearchParams();

  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);

  const response = await fetch(`${API_URL}/reports/payment-breakdown?${query.toString()}`, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load payment breakdown.");
  }

  return data;
};

export const getTopSellers = async ({ startDate, endDate } = {}) => {
  const query = new URLSearchParams();

  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);

  const response = await fetch(`${API_URL}/reports/top-sellers?${query.toString()}`, {
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load top sellers.");
  }

  return data;
};
