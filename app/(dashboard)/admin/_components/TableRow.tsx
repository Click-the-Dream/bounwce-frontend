export default function TabRow({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            active === t.key
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span
              className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${active === t.key ? "bg-violet-100 text-violet-700" : "bg-slate-200 text-slate-500"}`}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
