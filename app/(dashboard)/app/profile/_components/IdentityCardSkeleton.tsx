const IdentityCardSkeleton = () => {
  return (
    <div className="bg-[#F7F7F7] p-3.75 w-full animate-pulse">
      <div className="w-15 h-15 bg-gray-200 rounded-[20px] mb-3.25" />

      <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-20 bg-gray-200 rounded mb-4" />

      <div className="flex gap-2 mb-5.5">
        <div className="h-7 w-24 bg-gray-200 rounded-full" />
        <div className="h-7 w-24 bg-gray-200 rounded-full" />
      </div>

      <div className="space-y-2">
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-5/6 bg-gray-200 rounded" />
      </div>
    </div>
  );
};

export default IdentityCardSkeleton;
