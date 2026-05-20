export default function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white w-full rounded-[10px] border border-slate-200/80 ${className}`}
    >
      {children}
    </div>
  );
}
