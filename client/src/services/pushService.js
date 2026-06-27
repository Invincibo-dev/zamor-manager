import { API_URL } from "./authApi";

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
};

export const isPushSupported = () =>
  "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

export const getPermission = () => Notification.permission; // "default" | "granted" | "denied"

export const requestPermission = async () => {
  if (!isPushSupported()) return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

const getRegistration = async () => {
  const regs = await navigator.serviceWorker.getRegistrations();
  return regs[0] || null;
};

export const subscribePush = async () => {
  if (!isPushSupported()) return null;
  if (Notification.permission !== "granted") return null;

  // Récupère la clé publique VAPID depuis le backend
  const keyRes = await fetch(`${API_URL}/push/vapid-public-key`, { credentials: "include" });
  if (!keyRes.ok) return null; // VAPID non configuré — fonctionnalité désactivée
  const { publicKey } = await keyRes.json();

  const reg = await getRegistration();
  if (!reg) return null;

  const existing = await reg.pushManager.getSubscription();
  if (existing) {
    // Synchronise avec le serveur en cas de redémarrage
    await saveSub(existing);
    return existing;
  }

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  await saveSub(sub);
  return sub;
};

export const unsubscribePush = async () => {
  const reg = await getRegistration();
  if (!reg) return;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;

  await fetch(`${API_URL}/push/unsubscribe`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});

  await sub.unsubscribe();
};

const saveSub = async (sub) => {
  const json = sub.toJSON();
  await fetch(`${API_URL}/push/subscribe`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    }),
  }).catch(() => {});
};
