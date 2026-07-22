const EventDetailsSkeleton = () => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 md:px-6 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          {/* Banner */}
          <div className="h-60 rounded-[10px] bg-gray-200" />

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-25.5 rounded-[10px] border border-gray-200 p-4"
              >
                <div className="w-5 h-5 bg-gray-200 rounded mb-5" />
                <div className="w-16 h-3 bg-gray-200 rounded mb-2" />
                <div className="w-24 h-3 bg-gray-200 rounded" />
              </div>
            ))}
          </div>

          {/* About */}
          <div className="space-y-3 mt-8">
            <div className="w-40 h-4 bg-gray-200 rounded" />
            <div className="w-full h-3 bg-gray-200 rounded" />
            <div className="w-4/5 h-3 bg-gray-200 rounded" />

            <div className="flex gap-2 pt-3">
              {[1, 2, 3].map((tag) => (
                <div key={tag} className="w-20 h-6 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="mt-10">
            <div className="w-20 h-4 bg-gray-200 rounded mb-7" />

            <div className="h-32 rounded-[10px] border border-gray-200 flex">
              <div className="w-1/3 bg-gray-200" />

              <div className="p-5 space-y-3">
                <div className="w-40 h-3 bg-gray-200 rounded" />
                <div className="w-52 h-3 bg-gray-200 rounded" />
                <div className="w-24 h-3 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="h-10 rounded-full bg-gray-200" />
            <div className="h-10 rounded-full bg-gray-200" />

            <div className="border-t border-gray-200 pt-4">
              <div className="h-8 w-24 bg-gray-200 rounded ml-auto" />
            </div>
          </div>

          <div className="h-16 border border-gray-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

export default EventDetailsSkeleton;
