export default function MacroBar({ label, current, goal, color }) {
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const isOver = current > goal;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-baseline">
        <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">{label}</span>
        <div className="flex items-baseline gap-0.5">
          <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
            {Math.round(current)}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-600">/{goal}g</span>
        </div>
      </div>
      <div className="h-[7px] bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: isOver ? "#EF4444" : color }}
        />
      </div>
    </div>
  );
}
