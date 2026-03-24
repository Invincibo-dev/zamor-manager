import {
  buildApiUrl,
  downloadBlob,
  openBlobInNewTab,
  requestBlob,
  requestJson,
} from "./http";

export const createSaleReceiptRequest = (payload) =>
  requestJson("/sales", {
    method: "POST",
    body: payload,
    errorMessage: "Failed to create sale receipt.",
  });

export const getReceiptPdfUrl = (code) => {
  return buildApiUrl(`/sales/pdf/${encodeURIComponent(code)}`);
};

export const downloadReceiptPdf = async (code) => {
  const blob = await requestBlob(`/sales/pdf/${encodeURIComponent(code)}`, {
    errorMessage: "Failed to download PDF.",
  });
  downloadBlob(blob, `${code}.pdf`);
};

export const getSaleByCodeRequest = (code) =>
  requestJson(`/sales/code/${encodeURIComponent(code)}`, {
    errorMessage: "Failed to load sale receipt.",
  });

export const viewReceiptPdf = async (code) => {
  const blob = await requestBlob(`/sales/pdf/${encodeURIComponent(code)}`, {
    errorMessage: "Failed to open PDF.",
  });
  openBlobInNewTab(blob);
};

export const getAdminReport = (period, queryString = "") =>
  requestJson(`/reports/${period}${queryString}`, {
    errorMessage: "Failed to load admin report.",
  });

export const getSalesByDateRange = async ({ startDate, endDate }) => {
  const query = {};

  if (startDate) {
    query.startDate = startDate;
  }

  if (endDate) {
    query.endDate = endDate;
  }

  return requestJson("/sales", {
    query,
    errorMessage: "Failed to load sales list.",
  });
};
