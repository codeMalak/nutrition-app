import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { Loader2, MailCheck } from "lucide-react";
import NutriIcon from "../components/NutriIcon";

export default function LoginPage({ setToken }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUnverifiedEmail("");
    setLoading(true);
    try {
      const res = await api.login(form);
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      if (data?.unverified) {
        setUnverifiedEmail(data.email || form.email);
      } else {
        setError(data?.error || "Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await api.resendVerification(unverifiedEmail);
      setResendSent(true);
    } catch {
      setError("Failed to resend email. Try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const inputCls =
    "w-full h-11 px-3.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow placeholder:text-slate-400 dark:placeholder:text-slate-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4 transition-colors duration-200">
      <div className="w-full max-w-[360px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <NutriIcon size={56} className="shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Unverified email notice */}
        {unverifiedEmail ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-100 dark:border-slate-700 p-7 transition-colors duration-200 text-center">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MailCheck size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">Email not verified</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Check your inbox for <span className="font-semibold text-slate-700 dark:text-slate-300">{unverifiedEmail}</span> and click the verification link.
            </p>
            {resendSent ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Email resent! Check your inbox.</p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="w-full h-11 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
              >
                {resendLoading && <Loader2 size={15} className="animate-spin" />}
                {resendLoading ? "Sending…" : "Resend Verification Email"}
              </button>
            )}
            <button
              onClick={() => setUnverifiedEmail("")}
              className="mt-3 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-none border border-slate-100 dark:border-slate-700 p-7 transition-colors duration-200">
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-xl">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className={inputCls}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className={inputCls}
                  required
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 dark:shadow-none mt-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-5">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:text-indigo-700 dark:hover:text-indigo-300">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
