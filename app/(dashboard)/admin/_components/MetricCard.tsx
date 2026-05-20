import { TrendingDown, TrendingUp } from "lucide-react";

export default function MetricCard({
  label,
  value,
  delta,
  icon: Icon,
  iconColor,
}: {
  label: string;
  value: string;
  delta: number;
  icon: React.ElementType;
  iconColor: string;
}) {
  const up = delta >= 0;
  return (
    <div className="bg-white rounded-[10px] border border-slate-200/80 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500 font-medium">{label}</span>
        <span
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColor}`}
        >
          <Icon size={18} />
        </span>
      </div>
      <div>
        <div className="text-2xl font-semibold text-slate-900 tracking-tight">
          {value}
        </div>
        <div
          className={`flex items-center gap-1 mt-1 text-xs font-medium ${up ? "text-emerald-600" : "text-red-500"}`}
        >
          {up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {Math.abs(delta)}% {up ? "increase" : "decrease"} this month
        </div>
      </div>
    </div>
  );
}
