import { API_URL, requestJson, requestBlob } from "./http";
import {
  createSaleReceiptRequest,
  downloadReceiptPdf,
  getReceiptPdfUrl,
  getSalesByDateRange,
  viewReceiptPdf,
} from "./saleApi";
import { loginRequest } from "./authApi";

export { API_URL, loginRequest, getReceiptPdfUrl };

export const getProfile = () =>
  requestJson("/auth/me", {
    errorMessage: "Request failed.",
  });

export const getReport = (period, query = "") =>
  requestJson(`/reports/${period}${query}`, {
    errorMessage: "Request failed.",
  });

export const getSales = (params = {}) => getSalesByDateRange(params);

export const createSale = (payload) => createSaleReceiptRequest(payload);

export const openPdf = (code) => viewReceiptPdf(code);

export const downloadPdf = (code) => downloadReceiptPdf(code);

export const printPdf = async (code) => {
  const blob = await requestBlob(`/sales/pdf/${encodeURIComponent(code)}`, {
    errorMessage: "Unable to print PDF.",
  });
  const url = window.URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");

  if (!printWindow) {
    throw new Error("Popup blocked. Allow popups to print.");
  }

  printWindow.onload = () => {
    printWindow.print();
  };
};
