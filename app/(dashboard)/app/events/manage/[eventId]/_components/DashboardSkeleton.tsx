const DashboardSkeleton = () => {
  return (
    <div className="w-full max-w-195 bg-transparent mx-auto min-h-screen px-4 py-8 md:px-6 animate-pulse border-l-[0.53px] border-r-[0.53px] border-[#00000033]">
      {/* Back Button Skeleton */}
      <div className="h-6 w-36 bg-gray-200 rounded mb-6" />

      {/* Banner Skeleton */}
      <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden mb-6">
        <div className="h-36 bg-gray-200" />
        <div className="py-5 px-3 flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-gray-200 rounded-lg" />
            <div className="h-8 w-16 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-3.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white p-4 rounded-[8.25px] border border-gray-200 space-y-3"
          >
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-20 bg-gray-200 rounded" />
            <div className="h-1 w-12 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Breakdown & Attendance List Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 bg-white p-4 rounded-[10px] border border-gray-200 h-52" />
        <div className="lg:col-span-3 bg-white p-4 rounded-[10px] border border-gray-200 h-52" />
      </div>
    </div>
  );
};

export default DashboardSkeleton;
