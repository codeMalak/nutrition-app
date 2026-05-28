import { Home, Search, PlusCircle, ClipboardList, User } from "lucide-react";

const TABS = [
  { key: "home",    label: "Home",      Icon: Home },
  { key: "search",  label: "Search",    Icon: Search },
  { key: "add",     label: "Add Food",  Icon: PlusCircle },
  { key: "log",     label: "Food Log",  Icon: ClipboardList },
  { key: "profile", label: "Profile",   Icon: User },
];

export default function DesktopTabBar({ activeTab, setActiveTab }) {
  return (
    <div className="hidden md:flex items-center gap-1 pt-1">
      {TABS.map(({ key, label, Icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
              isActive
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
