"use client";

import { useState } from "react";
import useMatch from "@/app/hooks/use-match";
import ExploreCard from "./_components/ExploreCard";
import { SuggestedCandidate } from "@/app/_utils/types/payload";
import ExploreCardSkeleton from "../_components/loader/ExploreCardSkeleton";

const ExplorePage = () => {
  const { useGetSuggestedCandidates, createMatchRequest } = useMatch();

  const {
    data: suggestions,
    isLoading,
    isError,
    refetch,
  } = useGetSuggestedCandidates();

  const [pendingMap, setPendingMap] = useState<Record<string, boolean>>({});

  const handleConnect = (userId: string) => {
    setPendingMap((prev) => ({
      ...prev,
      [userId]: true,
    }));

    createMatchRequest.mutate(
      { target_user_id: userId },
      {
        onError: () => {
          setPendingMap((prev) => ({
            ...prev,
            [userId]: false,
          }));
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 py-5.75">
        <main className="flex justify-center px-4 md:px-8 xl:px-14">
          <div className="w-full max-w-7xl">
            {/* <h2 className="text-xl font-medium text-gray-700 mb-4 px-1">
              "Gym Partners near me"
            </h2> */}

            <div className="grid grid-cols-explore gap-x-2.5 gap-y-8.75 pb-12">
              {Array.from({ length: 8 }).map((_, i) => (
                <ExploreCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ❌ ERROR STATE
  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600 gap-3">
        <p>Failed to load suggestions.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-black text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  // 📭 EMPTY STATE
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        No suggestions available right now.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 py-5.75">
      <main className="flex justify-center px-4 md:px-8 xl:px-14">
        <div className="w-full max-w-7xl">
          <h2 className="text-xl font-medium text-gray-700 mb-4 px-1">
            "Gym Partners near me"
          </h2>

          <div className="grid grid-cols-explore gap-x-2.5 gap-y-8.75 pb-12">
            {suggestions.map((user: SuggestedCandidate) => (
              <ExploreCard
                key={user.user_id}
                {...user}
                isPending={!!pendingMap[user.user_id]}
                onConnect={handleConnect}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExplorePage;
