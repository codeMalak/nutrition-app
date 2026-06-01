import { useState } from "react";
import { X, Copy, Check, Share2, Twitter, Facebook } from "lucide-react";

const SITE_URL = "https://www.leanhostzone.com";

function buildShareText(totals, goals, water) {
  const pct = goals.dailyCalorieGoal > 0
    ? Math.round((totals.calories / goals.dailyCalorieGoal) * 100)
    : 0;

  return [
    `📊 My NutriTrack Progress Today!`,
    ``,
    `🔥 Calories: ${totals.calories} / ${goals.dailyCalorieGoal} kcal (${pct}%)`,
    `💪 Protein:  ${Math.round(totals.protein)}g`,
    `🍚 Carbs:    ${Math.round(totals.carbs)}g`,
    `🥑 Fat:      ${Math.round(totals.fats)}g`,
    `💧 Water:    ${water}/8 glasses`,
    ``,
    `Track yours free 👉 ${SITE_URL}`,
  ].join("\n");
}

export default function ShareModal({ totals, goals, water, onClose }) {
  const [copied, setCopied] = useState(false);

  const shareText = buildShareText(totals, goals, water);
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl  = encodeURIComponent(SITE_URL);

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: "My NutriTrack Progress", text: shareText, url: SITE_URL });
    } catch {
      // User cancelled — ignore
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const PLATFORMS = [
    {
      name: "Twitter / X",
      icon: <Twitter size={18} />,
      color: "bg-black hover:bg-zinc-800 text-white",
      url: `https://twitter.com/intent/tweet?text=${encodedText}`,
    },
    {
      name: "Facebook",
      icon: <Facebook size={18} />,
      color: "bg-[#1877F2] hover:bg-[#166fe5] text-white",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-sm border border-slate-100 dark:border-slate-700 shadow-2xl transition-colors duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Share Progress</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Preview card */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-4 text-white">
            <p className="text-xs font-semibold text-indigo-200 mb-3 uppercase tracking-wider">Today&apos;s Progress</p>
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              {[
                { label: "Calories", value: `${totals.calories} kcal` },
                { label: "Protein",  value: `${Math.round(totals.protein)}g` },
                { label: "Carbs",    value: `${Math.round(totals.carbs)}g` },
                { label: "Fat",      value: `${Math.round(totals.fats)}g` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/20 rounded-xl py-2">
                  <p className="text-sm font-bold leading-none">{value}</p>
                  <p className="text-[10px] text-indigo-200 mt-1">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-indigo-200 text-center">💧 Water: {water}/8 · NutriTrack</p>
          </div>

          {/* Native share (mobile — shows Instagram, WhatsApp, etc.) */}
          {typeof navigator !== "undefined" && navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-sm"
            >
              <Share2 size={15} />
              Share to Apps (Instagram, WhatsApp…)
            </button>
          )}

          {/* Platform buttons */}
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map(({ name, icon, color, url }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.97] ${color}`}
              >
                {icon}
                {name}
              </a>
            ))}
          </div>

          {/* Copy to clipboard */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
            {copied ? "Copied!" : "Copy Text"}
          </button>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
            For Instagram: tap <strong>Copy Text</strong> then paste in your story or caption.
          </p>
        </div>
      </div>
    </div>
  );
}
