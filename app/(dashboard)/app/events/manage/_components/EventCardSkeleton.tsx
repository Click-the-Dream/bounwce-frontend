const EventCardSkeleton = () => {
  return (
    <div className="bg-white rounded-[10px] border border-gray-100 shadow-[0_0px_19.1px_0px_#00000040] overflow-hidden flex flex-col animate-pulse">
      {/* Banner */}
      <div className="relative h-12 w-full bg-gray-200">
        <div className="absolute top-2 left-2 h-5 w-16 rounded-md bg-gray-300" />
        <div className="absolute top-3 right-3 h-4 w-4 rounded bg-gray-300" />
      </div>

      {/* Content */}
      <div className="p-2 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <div className="h-4 w-3/4 rounded bg-gray-200 mb-3" />

          {/* Date & Location */}
          <div className="flex items-center gap-4 mb-2">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-gray-200" />
              <div className="h-3 w-20 rounded bg-gray-200" />
            </div>

            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-gray-200" />
              <div className="h-3 w-24 rounded bg-gray-200" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-[0.53px] border-dashed border-[#BEBEBE] pt-3 mt-auto flex items-end justify-between">
          <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
            <div>
              <div className="h-4 w-8 rounded bg-gray-200 mb-1" />
              <div className="h-3 w-14 rounded bg-gray-200" />
            </div>

            <div>
              <div className="h-4 w-8 rounded bg-gray-200 mb-1" />
              <div className="h-3 w-14 rounded bg-gray-200" />
            </div>
          </div>

          <div className="h-4 w-4 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
};

export default EventCardSkeleton;
