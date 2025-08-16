import { useEffect, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";

export default function QRCodeDisplay({url}: {url?: string | undefined}) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { width: 90 }, (err, dataUrl) => {
      if (err) {
        console.error(err);
        return;
      }
      setQrCodeUrl(dataUrl);
    });
  }, [url]);

  return (
    <>
      {qrCodeUrl && (
        <Image
          src={qrCodeUrl}
          alt="QR Code"
          width={90}
          height={90}
        />
      )}
    </>
  );
}
