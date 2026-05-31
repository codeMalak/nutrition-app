import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import NutriIcon from "../components/NutriIcon";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    api.verifyEmail(token)
      .then((res) => {
        setMessage(res.data.message);
        setStatus("success");
      })
      .catch((err) => {
        setMessage(err.response?.data?.error || "Verification failed. The link may have expired.");
        setStatus("error");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4 transition-colors duration-200">
      <div className="w-full max-w-[360px] text-center">
        <NutriIcon size={48} className="shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 mb-6" />

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-100 dark:border-slate-700 p-8 transition-colors duration-200">

          {status === "loading" && (
            <>
              <Loader2 size={36} className="animate-spin text-indigo-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Verifying your email…</h2>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={28} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Email Verified!</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
              <Link
                to="/login"
                className="block w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all"
              >
                Sign In
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <XCircle size={28} className="text-red-500 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Verification Failed</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
              <Link
                to="/login"
                className="block w-full py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-all"
              >
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
