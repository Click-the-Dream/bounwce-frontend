import { statusConfig } from "@/app/_utils/utility";

export default function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status as keyof typeof statusConfig] ?? {
    label: status,
    cls: "bg-slate-100 text-slate-600 border border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}
