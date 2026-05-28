export default function CalorieRing({ consumed, goal }) {
  const size = 164;
  const strokeWidth = 13;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const offset = circumference * (1 - progress);
  const remaining = Math.max(goal - consumed, 0);
  const isOver = consumed > goal;

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        {/* Track — uses Tailwind stroke class for dark mode */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-slate-200 dark:stroke-slate-700"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isOver ? "#EF4444" : "#6366F1"}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 0.7s cubic-bezier(0.4,0,0.2,1), stroke 0.3s ease",
          }}
        />
      </svg>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-bold leading-none text-slate-900 dark:text-slate-100">
          {consumed.toLocaleString()}
        </span>
        <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
          of {goal.toLocaleString()} kcal
        </span>
        <span className={`text-xs font-semibold mt-1.5 ${isOver ? "text-red-500" : "text-emerald-500"}`}>
          {isOver
            ? `${(consumed - goal).toLocaleString()} over`
            : `${remaining.toLocaleString()} left`}
        </span>
      </div>
    </div>
  );
}
