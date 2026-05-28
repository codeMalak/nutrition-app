import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function BarcodeScanner({ onScan, onClose }) {

  const videoRef = useRef(null);

  useEffect(() => {

    const codeReader = new BrowserMultiFormatReader();

    const constraints = {
      video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    codeReader.decodeFromConstraints(
      constraints,
      videoRef.current,
      (result, err) => {
        if (result) {
          onScan(result.getText());
        }
      }
    );

    return () => {
      codeReader.reset();
    };

  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">

      <div className="relative">

        {/* VIDEO */}
        <video
          ref={videoRef}
          className="w-[360px] h-[260px] rounded-lg object-cover"
        />

        {/* SCANNING FRAME */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

          <div className="relative w-64 h-40 border-2 border-green-400 rounded">

            {/* animated scan line */}
            <div className="absolute left-0 right-0 h-1 bg-green-400 animate-scan"></div>

          </div>

        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-red-500 text-white px-5 py-2 rounded"
        >
          Cancel
        </button>

      </div>

    </div>
  );
}