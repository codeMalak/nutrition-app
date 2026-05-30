import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { api } from "../api";
import { X, Loader2, RefreshCw, Plus, Barcode } from "lucide-react";

const MEALS = ["breakfast", "lunch", "dinner", "snacks"];

const CAMERA_CONSTRAINTS = {
  video: {
    facingMode: "environment",
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
};

// ─── Inner camera component ────────────────────────────────────────────────
// Mounts the camera on mount, stops on unmount — clean lifecycle.
function ScannerCamera({ onScan, onError }) {
  const videoRef = useRef(null);
  const firedRef = useRef(false); // prevent double-fire

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();

    codeReader
      .decodeFromConstraints(CAMERA_CONSTRAINTS, videoRef.current, (result) => {
        if (result && !firedRef.current) {
          firedRef.current = true;
          onScan(result.getText());
        }
      })
      .catch(() => onError());

    return () => {
      try {
        codeReader.reset();
      } catch (_) {}
    };
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-black">
      <video ref={videoRef} className="w-full h-[260px] object-cover" />

      {/* Overlay with corner-bracket frame */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Semi-dark vignette */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Scanner frame */}
        <div className="relative z-10 w-56 h-32">
          {/* Four corner brackets */}
          <span className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-md" />
          <span className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-md" />
          <span className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-md" />
          <span className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-md" />

          {/* Animated scan line */}
          <div className="absolute left-2 right-2 h-px bg-emerald-400/80 animate-scan" />
        </div>
      </div>
    </div>
  );
}

// ─── Main BarcodeScanner modal ─────────────────────────────────────────────
export default function BarcodeScanner({ onAdd, onClose, defaultMealType = "snacks" }) {
  const [phase, setPhase] = useState("scanning"); // scanning | loading | found | notfound | error
  const [food, setFood] = useState(null);
  const [scannedCode, setScannedCode] = useState("");
  const [grams, setGrams] = useState(100);
  const [mealType, setMealType] = useState(defaultMealType);
  const [errorMsg, setErrorMsg] = useState("");

  const handleBarcodeDetected = async (code) => {
    setScannedCode(code);
    setPhase("loading");
    try {
      const res = await api.getFoodByBarcode(code);
      setFood(res.data);
      setGrams(res.data.servingSize || 100);
      setPhase("found");
    } catch (err) {
      if (err.response?.status === 404) {
        setPhase("notfound");
      } else {
        setErrorMsg("Barcode lookup failed. Check your connection.");
        setPhase("error");
      }
    }
  };

  const handleScanAgain = () => {
    setFood(null);
    setScannedCode("");
    setErrorMsg("");
    setPhase("scanning");
  };

  const handleConfirm = () => {
    if (!food) return;
    const base = food.servingSize || 100;
    const factor = grams / base;
    onAdd(
      {
        name: food.name,
        calories: Math.round((food.calories || 0) * factor),
        protein: +((food.protein || 0) * factor).toFixed(1),
        carbs: +((food.carbs || 0) * factor).toFixed(1),
        fats: +((food.fats || 0) * factor).toFixed(1),
      },
      mealType
    );
    onClose();
  };

  // Scaled macros based on current grams input
  const scaled = food
    ? (() => {
        const f = grams / (food.servingSize || 100);
        return {
          calories: Math.round((food.calories || 0) * f),
          protein: ((food.protein || 0) * f).toFixed(1),
          carbs: ((food.carbs || 0) * f).toFixed(1),
          fats: ((food.fats || 0) * f).toFixed(1),
        };
      })()
    : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center px-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <X size={20} />
      </button>

      {/* ── SCANNING PHASE ── */}
      {phase === "scanning" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Barcode size={17} className="text-emerald-400" />
              <p className="text-white font-semibold text-sm">Scan a Barcode</p>
            </div>
            <p className="text-white/50 text-xs">Point camera at any product barcode</p>
          </div>

          <ScannerCamera
            onScan={handleBarcodeDetected}
            onError={() => {
              setPhase("error");
              setErrorMsg(
                "Camera access denied. Enable camera permissions and try again."
              );
            }}
          />

          <p className="text-white/25 text-[11px] tracking-wide">
            EAN-13 · UPC-A · QR codes
          </p>
        </div>
      )}

      {/* ── LOADING PHASE ── */}
      {phase === "loading" && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="text-indigo-400 animate-spin" />
          <div className="text-center">
            <p className="text-white font-semibold">Looking up product…</p>
            <p className="text-white/40 text-[11px] mt-1 font-mono">{scannedCode}</p>
          </div>
        </div>
      )}

      {/* ── FOUND PHASE ── */}
      {phase === "found" && food && scaled && (
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-2xl">
            {/* Product info */}
            <div className="mb-4">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full mb-2">
                ✓ Product found
              </span>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                {food.name}
              </h3>
              {food.brand && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {food.brand}
                </p>
              )}
            </div>

            {/* Live macro pills — update as grams changes */}
            <div className="flex gap-1.5 flex-wrap mb-4">
              {[
                { label: `${scaled.calories} kcal`, cls: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" },
                { label: `P ${scaled.protein}g`,   cls: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" },
                { label: `C ${scaled.carbs}g`,     cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" },
                { label: `F ${scaled.fats}g`,      cls: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400" },
              ].map(({ label, cls }) => (
                <span key={label} className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${cls}`}>
                  {label}
                </span>
              ))}
            </div>

            {/* Serving size */}
            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">
                Serving Size
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(Math.max(1, Number(e.target.value)))}
                  className="w-24 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="1"
                />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {food.servingUnit || "g"}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  (base: {food.servingSize || 100}
                  {food.servingUnit || "g"})
                </span>
              </div>
            </div>

            {/* Meal selector */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5">
                Add to Meal
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {MEALS.map((meal) => (
                  <button
                    key={meal}
                    onClick={() => setMealType(meal)}
                    className={`py-1.5 rounded-xl text-[11px] font-semibold capitalize transition-all ${
                      mealType === meal
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {meal}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleScanAgain}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <RefreshCw size={13} />
                Again
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all"
              >
                <Plus size={14} />
                Add to Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NOT FOUND PHASE ── */}
      {phase === "notfound" && (
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-2xl">
            <p className="text-4xl mb-3">🔍</p>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">
              Product not found
            </h3>
            <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-1 mb-1">
              {scannedCode}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              This barcode isn&apos;t in the USDA database. Try searching by
              name instead.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleScanAgain}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw size={13} />
                Scan Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR PHASE ── */}
      {phase === "error" && (
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 text-center shadow-2xl">
            <p className="text-4xl mb-3">⚠️</p>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">
              Something went wrong
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-5">
              {errorMsg}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleScanAgain}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                <RefreshCw size={13} />
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
