export const EventCardSkeleton = () => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col h-full animate-pulse">
      {/* Event Image Banner Skeleton */}
      <div className="relative w-full aspect-16/10 bg-gray-200">
        {/* Status Badge Skeleton */}
        <div className="absolute top-3 left-3 h-5 w-16 bg-gray-300/60 rounded-md" />
        {/* Options Button Skeleton */}
        <div className="absolute top-3 right-3 h-6 w-6 bg-gray-300/60 rounded-full" />
      </div>

      {/* Card Body Skeleton */}
      <div className="p-3.5 flex flex-col grow">
        {/* Title Skeleton */}
        <div className="h-4 bg-gray-200 rounded-md my-2 w-3/4" />

        {/* Event Meta Details Skeleton */}
        <div className="space-x-4 mb-4 flex gap-1 items-center">
          {/* Date Skeleton */}
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 bg-gray-200 rounded-full shrink-0" />
            <div className="h-3 w-16 bg-gray-200 rounded-md" />
          </div>
          {/* Location Skeleton */}
          <div className="flex items-center gap-1.5">
            <div className="h-4 w-4 bg-gray-200 rounded-full shrink-0" />
            <div className="h-3 w-20 bg-gray-200 rounded-md" />
          </div>
        </div>

        {/* Card Footer Skeleton */}
        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
          {/* Avatar Stack Skeleton */}
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5">
              <div className="w-5.25 h-5.25 rounded-full bg-gray-200 border border-white shrink-0" />
              <div className="w-5.25 h-5.25 rounded-full bg-gray-200 border border-white shrink-0" />
              <div className="w-5.25 h-5.25 rounded-full bg-gray-200 border border-white shrink-0" />
            </div>
            <div className="h-3 w-4 bg-gray-200 rounded-xs" />
          </div>

          {/* Action Link Skeleton */}
          <div className="h-3 w-16 bg-gray-200 rounded-md" />
        </div>
      </div>
    </div>
  );
};
