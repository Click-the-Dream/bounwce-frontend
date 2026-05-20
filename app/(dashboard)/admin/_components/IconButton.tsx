export default function IconBtn({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all
        ${
          danger
            ? "border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600"
            : "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
        }`}
    >
      {Icon && <Icon size={13} />}
    </button>
  );
}
