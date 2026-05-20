export default function TableShell({
  children,
  headers,
}: {
  children: React.ReactNode;
  headers: string[];
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-max w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 first:pl-6 last:pr-6 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
