// Service d'impression thermique via Web Serial API (Chrome 89+, Android Chrome).
// Connecte un port série (USB ou Bluetooth) et envoie des données ESC/POS brutes.

import { buildReceiptEscPos } from "../utils/escpos";

export const isThermalSupported = () => "serial" in navigator;

let _port = null; // port série actif

const openPort = async () => {
  if (_port && _port.readable) return _port;

  const port = await navigator.serial.requestPort();
  await port.open({ baudRate: 9600 });
  _port = port;
  return port;
};

export const printThermal = async (receipt, company = {}) => {
  if (!isThermalSupported()) {
    throw new Error("L'impression série n'est pas supportée dans ce navigateur.");
  }

  const data = buildReceiptEscPos(receipt, company);
  const port = await openPort();
  const writer = port.writable.getWriter();

  try {
    await writer.write(data);
  } finally {
    writer.releaseLock();
  }
};

export const disconnectPrinter = async () => {
  if (!_port) return;
  try {
    await _port.close();
  } catch { /* déjà fermé */ }
  _port = null;
};
