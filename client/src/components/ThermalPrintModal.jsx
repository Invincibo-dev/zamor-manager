import { createPortal } from "react-dom";
import { useEffect } from "react";
import ThermalReceipt from "./ThermalReceipt";

export default function ThermalPrintModal({ type, data, onClose }) {
  const printRoot = document.getElementById("print-root");

  // Auto-trigger print once the receipt has rendered
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Receipt renders in #print-root — only visible during @media print */}
      {printRoot && createPortal(<ThermalReceipt type={type} data={data} />, printRoot)}

      {/* Browser overlay — hidden during print via @media print #root { display: none } */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4">
        <div className="w-full max-w-xs rounded-3xl bg-white p-6 shadow-2xl">
          <div className="mb-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
              🖨
            </div>
            <p className="font-semibold text-slate-900">Impression lancée</p>
            <p className="mt-1 text-sm text-slate-500">
              Sélectionnez <strong>PT-210</strong> dans le dialogue d'impression
            </p>
          </div>

          {/* Receipt preview (screen only, not printed — #root is hidden during print) */}
          <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[10px]"
            style={{ fontFamily: "'Courier New', Courier, monospace", lineHeight: "1.5" }}>
            <ThermalReceipt type={type} data={data} />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 rounded-2xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Réimprimer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl bg-slate-900 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
