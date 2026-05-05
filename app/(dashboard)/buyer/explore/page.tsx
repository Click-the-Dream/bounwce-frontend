"use client";

import { useMemo, useState } from "react";
import useMatch from "@/app/hooks/use-match";
import ExploreCard from "./_components/ExploreCard";
import { ConnectStatus, SuggestedCandidate } from "@/app/_utils/types/payload";
import ExploreCardSkeleton from "../_components/loader/ExploreCardSkeleton";
import { onFailure, onSuccess } from "@/app/_utils/notification";

const ExplorePage = () => {
  const { useGetSuggestedCandidates, createMatchRequest, useGetMatchRequests } =
    useMatch();

  const { data: matchRequests } = useGetMatchRequests();
  const [connectState, setConnectState] = useState<
    Record<string, ConnectStatus>
  >({});

  const requestMap = useMemo(() => {
    const map: Record<string, any> = {};

    if (!matchRequests) return map;

    for (const req of matchRequests) {
      const otherUserId = req.target_user_id;
      map[otherUserId] = req;
    }

    return map;
  }, [matchRequests]);

  const getStatus = (userId: string): ConnectStatus => {
    const req = requestMap[userId];

    if (!req) return "idle";

    switch (req.status) {
      case "pending":
        return "pending";
      case "accepted":
        return "sent";
      default:
        return "idle";
    }
  };

  const {
    data: suggestions,
    isLoading,
    isError,
    refetch,
  } = useGetSuggestedCandidates();

  const handleConnect = (userId: string) => {
    setConnectState((prev) => ({
      ...prev,
      [userId]: "loading",
    }));

    createMatchRequest.mutate(
      { target_user_id: userId },
      {
        onSuccess: () => {
          setConnectState((prev) => ({
            ...prev,
            [userId]: "pending",
          }));
          onSuccess({
            title: "Connection Request Sent",
            message: " Your connection request has been sent successfully.",
          });
        },
        onError: () => {
          setConnectState((prev) => ({
            ...prev,
            [userId]: "idle",
          }));
          onFailure({
            title: "Connection Request Failed",
            message: "Failed to send connection request. Please try again.",
          });
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

  // ERROR STATE
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

  // EMPTY STATE
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
          {/* <h2 className="text-xl font-medium text-gray-700 mb-4 px-1">
            "Gym Partners near me"
          </h2> */}

          <div className="grid grid-cols-explore gap-x-2.5 gap-y-8.75 pb-12">
            {suggestions.map((user: SuggestedCandidate) => {
              const status =
                connectState[user.user_id] || getStatus(user.user_id);

              return (
                <ExploreCard
                  key={user.user_id}
                  {...user}
                  connectStatus={status}
                  onConnect={handleConnect}
                />
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExplorePage;
