"use client";

import { useMemo, useState } from "react";
import useMatch from "@/app/hooks/use-match";
import ExploreCard from "./_components/ExploreCard";
import { ConnectStatus, SuggestedCandidate } from "@/app/_utils/types/payload";
import ExploreCardSkeleton from "../_components/loader/ExploreCardSkeleton";
import { onFailure, onSuccess } from "@/app/_utils/notification";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import ConnectionModal from "./_components/ConnectionModal";

interface ModalState {
  isOpen: boolean;
  userId: string;
  userName: string;
  userInitials: string;
}

const MODAL_CLOSED: ModalState = {
  isOpen: false,
  userId: "",
  userName: "",
  userInitials: "",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");

const ExplorePage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { useGetSuggestedCandidates, createMatchRequest, useGetMatchRequests } =
    useMatch();

  const { data: matchRequests } = useGetMatchRequests();
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

          onSuccess({
            title: "Connection Request Sent",
            message: "Your connection request has been sent successfully.",
          });

          // Open the modal — it handles auto-redirect internally
          setModal({
            isOpen: true,
            userId,
            userName: user.full_name ?? "this person",
            userInitials: getInitials(user.full_name ?? "?"),
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

  const goToChat = () => {
    setModal(MODAL_CLOSED);
    router.push(`/app/chat/${modal.userId}`);
  };

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
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        No suggestions available right now.
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
        userName={modal.userName}
        userInitials={modal.userInitials}
        onGoToChat={goToChat}
        onDismiss={dismissModal}
        autoRedirectSeconds={4}
      />
    </>
  );
};

export default ExplorePage;
