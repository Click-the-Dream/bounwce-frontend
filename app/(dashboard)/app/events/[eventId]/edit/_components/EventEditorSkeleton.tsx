export function EventEditorSkeleton() {
  return (
    <div className="min-h-screen max-w-170 mx-auto px-6 py-8 border-l-[0.53px] border-r-[0.53px] border-[#00000033] animate-pulse">
      <div className="h-8 w-8 rounded bg-gray-200 mb-8" />

      <div className="h-8 w-56 rounded bg-gray-200 mb-2" />
      <div className="h-4 w-72 rounded bg-gray-200 mb-8" />

      <div className="space-y-6">
        <div className="h-44 rounded-xl bg-gray-200" />

        <div className="h-11 rounded-lg bg-gray-200" />
        <div className="h-24 rounded-lg bg-gray-200" />

        <div className="grid grid-cols-2 gap-4">
          <div className="h-11 rounded-lg bg-gray-200" />
          <div className="h-11 rounded-lg bg-gray-200" />
        </div>

        <div className="h-11 rounded-lg bg-gray-200" />
        <div className="h-11 rounded-lg bg-gray-200" />

        <div className="flex justify-end">
          <div className="h-11 w-40 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
