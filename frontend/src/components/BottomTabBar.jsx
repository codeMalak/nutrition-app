import { Home, Footprints, Search, PlusCircle, ClipboardList, User } from "lucide-react";

const TABS = [
  { key: "home",    label: "Home",    Icon: Home },
  { key: "run",     label: "Run",     Icon: Footprints },
  { key: "search",  label: "Search",  Icon: Search },
  { key: "add",     label: "Add",     Icon: PlusCircle },
  { key: "log",     label: "Log",     Icon: ClipboardList },
  { key: "profile", label: "Profile", Icon: User },
];

export default function BottomTabBar({ activeTab, setActiveTab }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)] md:hidden transition-colors duration-200"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-6 h-[62px]">
        {TABS.map(({ key, label, Icon }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400"
                  : "text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400"
              }`}
            >
              {key === "add" ? (
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}>
                  <Icon size={20} className={isActive ? "text-white" : "text-slate-500 dark:text-slate-400"} strokeWidth={isActive ? 2.5 : 2} />
                </div>
              ) : (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
                  <span className={`text-[10px] leading-none font-medium ${
                    isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-600"
                  }`}>
                    {label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
