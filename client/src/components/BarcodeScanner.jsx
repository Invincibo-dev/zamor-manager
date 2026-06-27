import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const lastScannedRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  // Enumerate cameras on mount
  useEffect(() => {
    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devices) => {
        if (!devices.length) {
          setError("Aucune caméra détectée sur cet appareil.");
          return;
        }
        setCameras(devices);
        const preferred = devices.find((d) =>
          /back|rear|environment/i.test(d.label)
        );
        setSelectedCamera((preferred ?? devices[0]).deviceId);
      })
      .catch(() => setError("Permission caméra refusée ou indisponible."));
  }, []);

  // Start scanner when a camera is selected
  useEffect(() => {
    if (!selectedCamera || !videoRef.current) return;

    setReady(false);
    setError("");

    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromVideoDevice(selectedCamera, videoRef.current, (result) => {
        if (!result) return;
        const text = result.getText();
        // Debounce: ignore the same code for 2.5 s after each detection
        if (lastScannedRef.current === text) return;
        lastScannedRef.current = text;
        setTimeout(() => {
          lastScannedRef.current = null;
        }, 2500);
        onScan(text);
      })
      .then((controls) => {
        controlsRef.current = controls;
        setReady(true);
      })
      .catch(() => setError("Impossible de démarrer la caméra."));

    return () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCamera]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-0 sm:items-center sm:p-4">
      <div className="relative w-full overflow-hidden rounded-t-3xl bg-black shadow-2xl sm:max-w-sm sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              Scanner code-barres
            </p>
            <p className="mt-0.5 text-sm font-semibold text-white">
              {ready
                ? "Pointez vers un code IMEI ou QR"
                : error
                  ? "Erreur caméra"
                  : "Initialisation..."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
          >
            Fermer
          </button>
        </div>

        {/* Video feed */}
        <div className="relative aspect-[4/3] bg-slate-950">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            autoPlay
            playsInline
            muted
          />

          {/* Viewfinder overlay — only shown when camera is active */}
          {ready && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              {/* Darkened surround */}
              <div className="absolute inset-0 bg-slate-950/40" />
              {/* Clear window */}
              <div className="relative z-10 h-52 w-64">
                {/* Corner brackets */}
                <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-[3px] border-t-[3px] border-blue-400" />
                <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-[3px] border-t-[3px] border-blue-400" />
                <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-[3px] border-l-[3px] border-blue-400" />
                <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-[3px] border-r-[3px] border-blue-400" />
                {/* Animated scan line */}
                <div className="absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-blue-400 shadow-[0_0_10px_3px_rgba(96,165,250,0.7)]" />
              </div>
            </div>
          )}
        </div>

        {/* Error message */}
        {error ? (
          <div className="bg-red-950 px-4 py-3 text-sm text-red-300">{error}</div>
        ) : null}

        {/* Camera selector — only show when multiple cameras available */}
        {cameras.length > 1 ? (
          <div className="bg-slate-900 px-4 py-3">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Caméra
            </label>
            <select
              value={selectedCamera}
              onChange={(e) => {
                controlsRef.current?.stop();
                controlsRef.current = null;
                setSelectedCamera(e.target.value);
              }}
              className="w-full rounded-xl bg-white/10 px-3 py-2 text-xs text-white outline-none"
            >
              {cameras.map((cam, i) => (
                <option key={cam.deviceId} value={cam.deviceId} className="text-slate-900">
                  {cam.label || `Caméra ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {/* Safe-area spacer for notched phones */}
        <div className="h-safe-area-inset-bottom bg-slate-900" />
      </div>
    </div>
  );
}

export default BarcodeScanner;
