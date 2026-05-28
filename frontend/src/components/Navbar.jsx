import { ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
import DesktopTabBar from "./DesktopTabBar";

function formatDisplay(dateStr) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function Navbar({
  date,
  setDate,
  onLogout,
  activeTab,
  setActiveTab,
  toggleDark,
  darkMode,
}) {
  const changeDay = (delta) => {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  };

  const openDatePicker = () => {
    const input = document.getElementById("navbar-date-input");
    if (input?.showPicker) input.showPicker();
    else input?.click();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors duration-200">
      <div className="max-w-2xl mx-auto px-4 py-3 space-y-1">
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-sm">🥗</span>
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-none">
                NutriTrack
              </h1>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none">
                Track your macros
              </p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-1">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Date navigation */}
            <button
              onClick={() => changeDay(-1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ChevronLeft size={17} />
            </button>

            <div className="relative">
              <button
                onClick={openDatePicker}
                className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-w-[80px] text-center"
              >
                {formatDisplay(date)}
              </button>
              <input
                id="navbar-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                tabIndex={-1}
              />
            </div>

            <button
              onClick={() => changeDay(1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>

        <DesktopTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </header>
  );
}
