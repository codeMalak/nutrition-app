import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Loader2, Sparkles } from "lucide-react";
import { api } from "../api";
import NutriIcon from "../components/NutriIcon";

export default function PaymentSuccessPage() {
  const [verified, setVerified] = useState(false);

  // Poll profile until isPremium is true (webhook may take a moment)
  useEffect(() => {
    let attempts = 0;
    const check = async () => {
      try {
        const res = await api.getProfile();
        if (res.data.isPremium) {
          setVerified(true);
          return;
        }
      } catch {
        // ignore
      }
      attempts++;
      if (attempts < 10) setTimeout(check, 2000);
      else setVerified(true); // show success anyway after 20s
    };
    check();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4 transition-colors duration-200">
      <div className="w-full max-w-[360px] text-center">
        <NutriIcon size={48} className="shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 mb-6" />

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-100 dark:border-slate-700 p-8 transition-colors duration-200">

          {!verified ? (
            <>
              <Loader2 size={36} className="animate-spin text-indigo-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
                Confirming payment…
              </h2>
              <p className="text-sm text-slate-400 dark:text-slate-500">Just a moment</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Sparkles size={28} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex items-center justify-center gap-1.5 mb-3">
                <CheckCircle size={18} className="text-emerald-500" />
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  Payment Successful
                </p>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Welcome to Premium!
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Your account is now ad-free forever. Thanks for supporting NutriTrack!
              </p>
              <Link
                to="/dashboard"
                className="block w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all shadow-sm"
              >
                Go to Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
