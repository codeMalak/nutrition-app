import { useState } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";


export default function BarcodeScanner({ onScan, onCancel }) {
  const [data, setData] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-center">
          Scan a Barcode
        </h2>

        <BarcodeScannerComponent
          width={300}
          height={300}
          onUpdate={(err, result) => {
            if (result) {
              setData(result.text);
              onScan(result.text); // pass barcode back to parent
            }
          }}
        />

        {data && (
          <p className="mt-2 text-center text-green-600">
            Scanned: {data}
          </p>
        )}

        <button
          onClick={onCancel}
          className="mt-4 w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}