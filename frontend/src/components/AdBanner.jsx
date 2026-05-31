import { useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Google AdSense banner
//
// Setup steps:
//  1. Sign up at https://adsense.google.com and get approved.
//  2. Add this script to frontend/index.html inside <head>:
//       <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX" crossorigin="anonymous"></script>
//  3. Replace the two placeholder strings below with your real IDs.
//  4. Replace FRONTEND_URL in backend/.env with your production domain.
//
// Until configured, a labelled placeholder is shown instead of a live ad.
// ─────────────────────────────────────────────────────────────────────────────

const PUBLISHER_ID = "ca-pub-7046405761796757"; // e.g. ca-pub-1234567890123456
const SLOT_ID      = "3482633367";      // e.g. 9876543210

export default function AdBanner({ className = "" }) {
  const configured = PUBLISHER_ID !== "YOUR_PUBLISHER_ID";

  useEffect(() => {
    if (!configured) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not yet loaded
    }
  }, [configured]);

  if (!configured) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 py-4 px-3 ${className}`}
      >
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
          Ad space · Configure Google AdSense in{" "}
          <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-slate-500 dark:text-slate-400">
            AdBanner.jsx
          </code>
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={SLOT_ID}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
