export default function CardHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 flex-wrap gap-y-3">
      {children}
    </div>
  );
}
