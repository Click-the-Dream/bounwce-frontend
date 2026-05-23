"use client";

import { useCallback, useMemo, useState } from "react";
import useMatch from "@/app/hooks/use-match";
import ExploreCard from "./_components/ExploreCard";
import { ConnectStatus, SuggestedCandidate } from "@/app/_utils/types/payload";
import ExploreCardSkeleton from "../_components/loader/ExploreCardSkeleton";
import { onFailure } from "@/app/_utils/notification";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import ConnectionModal from "./_components/ConnectionModal";

interface ModalState {
  isOpen: boolean;
  userId: string;
  full_name: string;
  profile_pic?: {
    url: string;
  };
}

const MODAL_CLOSED: ModalState = {
  isOpen: false,
  userId: "",
  full_name: "",
};

const ExplorePage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { useGetSuggestedCandidates, createMatchRequest, useGetMatchRequests } =
    useMatch();

  const { data } = useGetMatchRequests();
  const matchRequests = data?.items;
  const [connectState, setConnectState] = useState<
    Record<string, ConnectStatus>
  >({});
  const [modal, setModal] = useState<ModalState>(MODAL_CLOSED);

  const requestMap = useMemo(() => {
    const map: Record<string, any> = {};
    if (!matchRequests) return map;
    for (const req of matchRequests) {
      map[req.target_user_id] = req;
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
        return "connected";
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

  const handleConnect = (userId: string, user: SuggestedCandidate) => {
    setConnectState((prev) => ({ ...prev, [userId]: "loading" }));

    createMatchRequest.mutate(
      { target_user_id: userId },
      {
        onSuccess: () => {
          setConnectState((prev) => ({ ...prev, [userId]: "pending" }));
          queryClient.invalidateQueries();

          // Open the modal — it handles auto-redirect internally
          setModal({
            isOpen: true,
            userId,
            full_name: user.full_name ?? "USer",
            profile_pic: user.profile_pic,
          });
        },
        onError: () => {
          setConnectState((prev) => ({ ...prev, [userId]: "idle" }));
          onFailure({
            title: "Connection Request Failed",
            message: "Failed to send connection request. Please try again.",
          });
        },
      },
    );
  };

  const goToChat = useCallback(() => {
    if (!modal.userId) return;

    router.push(`/app/chat/${modal.userId}`);
    setModal(MODAL_CLOSED);
  }, [modal.userId, router]);

  const dismissModal = () => {
    setModal(MODAL_CLOSED);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-800 py-5.75">
        <main className="flex justify-center px-4 md:px-8 xl:px-14">
          <div className="w-full max-w-7xl">
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

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.172 16.172a4 4 0 015.656 0M12 14h.01M7.5 8.5h.01M16.5 8.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-[16px] font-semibold text-gray-900">
            No suggestions yet
          </h2>

          {/* Description */}
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            We couldn’t find any recommendations right now. Try again later or
            update your preferences.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 text-gray-800 py-5.75">
        <main className="flex justify-center px-4 md:px-8 xl:px-14">
          <div className="w-full max-w-7xl">
            <div className="grid grid-cols-explore gap-x-2.5 gap-y-8.75 pb-12">
              {suggestions.map((user: SuggestedCandidate) => {
                const status =
                  connectState[user.user_id] || getStatus(user.user_id);

                return (
                  <ExploreCard
                    key={user.user_id}
                    {...user}
                    connectStatus={status}
                    onConnect={(id) => handleConnect(id, user)}
                  />
                );
              })}
            </div>
          </div>
        </main>
      </div>

      <ConnectionModal
        isOpen={modal.isOpen}
        full_name={modal.full_name}
        onGoToChat={goToChat}
        onDismiss={dismissModal}
        userId={modal?.userId}
      />
    </>
  );
};

export default ExplorePage;
