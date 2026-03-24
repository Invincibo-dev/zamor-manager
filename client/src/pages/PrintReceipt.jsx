import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { API_URL } from "../services/authApi";
import { getSaleByCodeRequest } from "../services/saleApi";

const formatAmount = (value) =>
  Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const formatDateTime = (value) =>
  new Date(value).toLocaleString("fr-FR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const getAbsoluteApiUrl = (path) => {
  if (API_URL.startsWith("http://") || API_URL.startsWith("https://")) {
    return new URL(path, API_URL).toString();
  }

  if (typeof window !== "undefined") {
    return new URL(path, window.location.origin).toString();
  }

  return path;
};

const logoUrl = getAbsoluteApiUrl("/api/assets/receipt-logo");

function DashedLine() {
  return <div className="my-1 border-t border-dashed border-black" />;
}

function PrintReceipt() {
  const { code } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const [logoSrc, setLogoSrc] = useState(logoUrl);
  const [logoReady, setLogoReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadReceipt = async () => {
      try {
        const data = await getSaleByCodeRequest(code);

        if (!isMounted) {
          return;
        }

        setReceipt(data.receipt);
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setError(requestError.message || "Impossible de charger le reçu.");
      }
    };

    loadReceipt();

    window.onafterprint = () => {
      window.close();
    };

    return () => {
      isMounted = false;
      window.onafterprint = null;
    };
  }, [code]);

  useEffect(() => {
    let isMounted = true;

    const preloadLogo = async () => {
      try {
        const response = await fetch(logoUrl, { method: "GET" });

        if (!response.ok) {
          throw new Error("Logo non disponible.");
        }

        const blob = await response.blob();

        if (!blob.type.startsWith("image/")) {
          throw new Error("Format de logo invalide.");
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          if (!isMounted) {
            return;
          }

          setLogoSrc(reader.result);
        };
        reader.readAsDataURL(blob);
      } catch {
        if (!isMounted) {
          return;
        }

        setLogoSrc(logoUrl);
      }
    };

    preloadLogo();

    return () => {
      isMounted = false;
    };
  }, []);

  const canPrint = useMemo(() => Boolean(receipt && logoReady), [receipt, logoReady]);

  useEffect(() => {
    if (!canPrint) {
      return;
    }

    const printNow = () => {
      window.print();
    };

    const printTimer = window.setTimeout(printNow, 180);
    return () => window.clearTimeout(printTimer);
  }, [canPrint]);

  if (error) {
    return (
      <main className="min-h-screen bg-white p-4 text-black">
        <div className="mx-auto max-w-sm border border-black p-3 font-mono text-xs">
          {error}
        </div>
      </main>
    );
  }

  if (!receipt) {
    return (
      <main className="min-h-screen bg-white p-4 text-black">
        <div className="mx-auto max-w-sm font-mono text-xs">Chargement du reçu...</div>
      </main>
    );
  }

  return (
    <main className="bg-white text-black">
      <div className="mx-auto w-[58mm] bg-white px-[2.5mm] py-[2.5mm] font-mono text-[10px] leading-[1.2] sm:w-[80mm] print:w-[58mm]">
        <div className="mb-1 text-center">
          <img
            id="logo"
            src={logoSrc}
            alt="Logo Zamor"
            className="mx-auto h-auto w-[14mm] object-contain sm:w-[18mm]"
            onLoad={() => setLogoReady(true)}
            onError={() => setLogoReady(true)}
          />
        </div>

        <div className="text-center text-[11px] font-bold uppercase sm:text-xs">
          ZAMOR MULTI SERVICES
        </div>
        <div className="text-center text-[10px]">Sèka la source</div>
        <div className="text-center text-[10px]">+509 3217-2809</div>

        <DashedLine />

        <div className="space-y-[2px] text-[10px]">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold">RCPT:</span>
            <span>{receipt.code_recu}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold">DT:</span>
            <span>{formatDateTime(receipt.date)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold">VEN:</span>
            <span className="truncate">{receipt.vendeur?.name || "-"}</span>
          </div>
        </div>

        <DashedLine />

        <div className="space-y-[5px]">
          {receipt.items?.map((item) => (
            <div key={item.id}>
              <div className="truncate pr-2 text-[10px] font-bold uppercase">
                {item.nom_produit}
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span>
                  {item.quantite} x {formatAmount(item.prix_unitaire)}
                </span>
                <span className="font-bold">{formatAmount(item.total)}</span>
              </div>
            </div>
          ))}
        </div>

        <DashedLine />

        <div className="flex items-center justify-between gap-3 text-[11px] font-bold">
          <span>TOTAL:</span>
          <span>{formatAmount(receipt.total_general)}G</span>
        </div>
        <div className="mt-[2px] flex items-center justify-between gap-3 text-[10px]">
          <span className="font-bold">PAY:</span>
          <span>{String(receipt.mode_paiement || "").toUpperCase()}</span>
        </div>

        <DashedLine />

        <div className="pt-[2px] text-center text-[10px]">Mèsi anpil</div>
      </div>
    </main>
  );
}

export default PrintReceipt;
