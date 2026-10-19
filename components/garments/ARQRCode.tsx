"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";

interface Props {
  url: string;
}

const QR_SIZE_PX = 160;

// QR code for handing the garment page to a phone, rendered as a data-URL
// image (CSP img-src already allows data:). Falls back to the plain URL if
// generation fails.
export default function ARQRCode({ url }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { margin: 1, width: QR_SIZE_PX * 2, errorCorrectionLevel: "M" }).then(
      (png) => {
        if (!cancelled) setDataUrl(png);
      },
      () => {
        if (!cancelled) setFailed(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (failed) {
    return <p className="text-xs text-archive-muted break-all max-w-[12rem]">{url}</p>;
  }
  if (!dataUrl) {
    return <div className="w-40 h-40 bg-archive-surface-muted animate-pulse" aria-hidden />;
  }
  return (
    <Image
      src={dataUrl}
      alt={`QR code linking to ${url}`}
      width={QR_SIZE_PX}
      height={QR_SIZE_PX}
      unoptimized
      className="bg-white p-2"
    />
  );
}
