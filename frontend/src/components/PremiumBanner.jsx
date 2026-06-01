import { useState } from "react";
import { Sparkles, Loader2, X, AlertCircle } from "lucide-react";
import { api } from "../api";

export default function PremiumBanner({ className = "" }) {
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState("");

  if (dismissed) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.createCheckoutSession();
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError("No checkout URL returned.");
        setLoading(false);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Something went wrong.";
      setError(msg);
      console.error("Checkout error:", err.response?.data || err.message);
      setLoading(false);
    }
  };

  return (
    <div className={`relative bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-4 text-white shadow-md shadow-indigo-200/30 dark:shadow-none ${className}`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 p-1 rounded-lg hover:bg-white/20 transition-colors"
      >
        <X size={14} className="text-white/70" />
      </button>

      <div className="flex items-center gap-3 pr-6">
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Sparkles size={17} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">Go Ad-Free Forever</p>
          <p className="text-xs text-indigo-200 mt-0.5">One-time payment · No subscription</p>
        </div>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="flex-shrink-0 flex items-center gap-1.5 bg-white text-indigo-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-indigo-50 active:scale-[0.97] transition-all disabled:opacity-70 shadow-sm"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <>$0.99</>}
        </button>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 bg-red-500/20 border border-red-400/30 rounded-xl px-3 py-2">
          <AlertCircle size={14} className="text-red-200 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-100">{error}</p>
        </div>
      )}
    </div>
  );
}
