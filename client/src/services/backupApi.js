import { API_URL } from "./authApi";

export const downloadDatabaseBackup = async () => {
  const res = await fetch(`${API_URL}/backup/database`, { credentials: "include" });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Backup impossible.");
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match ? match[1] : `zamor-backup-${new Date().toISOString().slice(0, 10)}.sql`;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const getBackupList = async () => {
  const res = await fetch(`${API_URL}/backup/list`, { credentials: "include" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Liste impossible.");
  return data.backups; // [{ name, size, date }]
};

export const downloadSavedBackup = async (filename) => {
  const res = await fetch(`${API_URL}/backup/files/${encodeURIComponent(filename)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Fichier introuvable.");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
