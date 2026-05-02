const ExploreCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col w-full animate-pulse">
      {/* header image */}
      <div className="p-1.5 pb-0">
        <div className="h-32.5 w-full rounded-[20px] bg-gray-200" />

        {/* profile section */}
        <div className="px-2.5 mt-3">
          <div className="w-15.75 h-15.25 rounded-[20px] bg-gray-200 -mt-[30.5px] mb-3" />

          <div className="h-3 w-28 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
      </div>

      {/* stats */}
      <div className="mx-4 mt-4 border-t border-gray-100 pt-3">
        <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
      </div>

      {/* interests */}
      <div className="flex gap-2 px-4 pb-5">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
        <div className="h-5 w-14 bg-gray-200 rounded-full" />
      </div>
    </div>
  );
};

export default ExploreCardSkeleton;
