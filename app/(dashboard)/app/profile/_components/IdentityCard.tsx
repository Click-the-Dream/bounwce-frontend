"use client";

import {
  Check,
  Loader2,
  MessageCircleReply,
  MinusCircle,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Send,
  X,
} from "lucide-react";
import React, { useState } from "react";
import IdentityCardSkeleton from "./IdentityCardSkeleton";
import useMatch from "@/app/hooks/use-match";
import { onFailure, onSuccess } from "@/app/_utils/notification";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { shareProfile } from "@/app/_utils/share";
import { slugify } from "@/app/_utils/slugify";
import EditProfileModal from "./EditProfileModal";
import ProfileImage from "./ProfileImage";
import { useNotifications } from "@/app/context/NotificationContext";

type Props = {
  data: any;
  isOwnProfile: boolean;
  isLoading?: boolean;
  isConnectionLoading?: boolean;
};

type ConnectionStatusResponse = {
  other_user_id?: string;
  status?: string | null;
  is_connected?: boolean;
  request_id?: string | null;
  request_direction?: string | null;
  requested_at?: string | null;
  responded_at?: string | null;
  connected_at?: string | null;
};

const normalizeStatus = (value?: string | null) =>
  value?.trim().toLowerCase().replace(/[ -]+/g, "_") ?? "";

const IdentityCard: React.FC<Props> = ({
  data,
  isOwnProfile,
  isLoading,
  isConnectionLoading,
}) => {
  const { authDetails, setShowAuthModal } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [openEditProfile, setOpenEditProfile] = useState(false);
  const [localConnectStatus, setLocalConnectStatus] = useState<
    "idle" | "loading" | "pending" | "connected"
  >("idle");
  const [actionLoading, setActionLoading] = useState<
    "accept" | "reject" | null
  >(null);

  const { setConnectionModal } = useNotifications();

  const {
    createMatchRequest,
    useGetMatchRequests,
    useGetSentMatchRequests,
    respondToMatchRequest,
    useGetConnectionStatus,
  } = useMatch();

  const { data: appRequests, isLoading: isLoadingMatchRequests } =
    useGetMatchRequests({ enabled: !isOwnProfile, pageSize: 100 });
  const { data: sentRequests, isLoading: isLoadingSentRequests } =
    useGetSentMatchRequests(100, !isOwnProfile);

  const connectionStatusQuery = useGetConnectionStatus(data?.id, !isOwnProfile);

  const readRequestItems = (payload: any): any[] => {
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.requests)) return payload.requests;
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data?.requests)) return payload.data.requests;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };
  const matchRequests = [
    ...(appRequests?.pages ?? []).flatMap((page: any) => readRequestItems(page)),
    ...(sentRequests?.pages ?? []).flatMap((page: any) => readRequestItems(page)),
  ];

  if (isLoading) return <IdentityCardSkeleton />;

  const relation = matchRequests.find((req: any) => {
    return (
      (req.target_user?.id === data.id &&
        req.requester?.id === authDetails?.user?.id) ||
      (req.requester?.id === data.id &&
        req.target_user?.id === authDetails?.user?.id)
    );
  });

  // GET /matches/connection-status/{other_user_id}
  const connectionResponse = connectionStatusQuery.data as
    | ConnectionStatusResponse
    | null
    | undefined;

  const apiStatus = normalizeStatus(connectionResponse?.status);
  const relationStatus = normalizeStatus(relation?.status);
  const apiRequestDirection = normalizeStatus(
    connectionResponse?.request_direction,
  );

  const isRequester = relation?.requester_id === authDetails?.user?.id;

  const pendingStatuses = new Set([
    "pending",
    "requested",
    "awaiting_response",
    "awaiting_approval",
  ]);

  const connectedStatuses = new Set(["connected", "accepted", "matched"]);

  const terminalRequestStatuses = new Set([
    "expired",
    "rejected",
    "declined",
    "cancelled",
    "canceled",
    "withdrawn",
  ]);

  const isTerminalRequestStatus = terminalRequestStatuses.has(apiStatus);

  // The connection-status endpoint is authoritative.
  // For example, status="expired" and is_connected=false means
  // the old request is no longer pending and the user can reconnect.
  const isConnected =
    typeof connectionResponse?.is_connected === "boolean"
      ? connectionResponse.is_connected
      : apiStatus
        ? connectedStatuses.has(apiStatus)
        : connectedStatuses.has(relationStatus);

  // Never fall back to a stale pending request when the endpoint returns
  // an explicit status such as expired, rejected, or connected.
  const isPending = apiStatus
    ? pendingStatuses.has(apiStatus)
    : relationStatus === "pending";

  const hasApiRequestDirection = [
    "incoming",
    "outgoing",
    "inbound",
    "outbound",
  ].includes(apiRequestDirection);

  const isIncoming =
    isPending &&
    (apiRequestDirection === "incoming" ||
      apiRequestDirection === "inbound" ||
      (!hasApiRequestDirection && !isRequester));

  const isOutgoing =
    isPending &&
    (apiRequestDirection === "outgoing" ||
      apiRequestDirection === "outbound" ||
      (!hasApiRequestDirection && isRequester));

  const requestId = connectionResponse?.request_id ?? relation?.request_id;

  const isCheckingConnection =
    !isOwnProfile &&
    !connectionResponse &&
    (connectionStatusQuery.isLoading || isLoadingMatchRequests || isLoadingSentRequests);

  const handleConnect = () => {
    if (!authDetails?.user) {
      setShowAuthModal(true);
      return;
    }

    // An expired request must not prevent creating a new request.
    if (
      isPending ||
      isConnected ||
      createMatchRequest.isPending ||
      localConnectStatus === "loading"
    ) {
      return;
    }

    setLocalConnectStatus("loading");

    createMatchRequest.mutate(
      { target_user_id: data.id },
      {
        onSuccess: (response: any) => {
          setLocalConnectStatus("pending");

          // Update the cached status immediately so a stale "expired"
          // response does not briefly make the Connect button reappear.
          queryClient.setQueryData(
            ["matches", "connection-status", data.id],
            (previous: ConnectionStatusResponse | undefined) => ({
              ...previous,
              other_user_id: data.id,
              status: "pending",
              is_connected: false,
              request_direction: "outgoing",
              request_id:
                response?.request_id ??
                response?.data?.request_id ??
                previous?.request_id ??
                null,
            }),
          );

          setConnectionModal({
            isOpen: true,
            userId: data.id,
            full_name: data.name ?? "user",
            profile_pic: data.profile_pic,
          });

          queryClient.invalidateQueries({
            queryKey: ["matches", "requests"],
          });

          queryClient.invalidateQueries({
            queryKey: ["matches", "suggest"],
          });

          queryClient.invalidateQueries({
            queryKey: ["matches", "connection-status", data.id],
          });
        },

        onError: () => {
          setLocalConnectStatus("idle");

          onFailure({
            title: "Failed",
            message: "Could not send request.",
          });
        },
      },
    );
  };

  const handleAccept = () => {
    if (!authDetails?.user) {
      setShowAuthModal(true);
      return;
    }

    if (!requestId) {
      onFailure({
        title: "Failed",
        message: "Could not find the request.",
      });
      return;
    }

    setActionLoading("accept");

    respondToMatchRequest.mutate(
      {
        request_id: requestId,
        action: "accept",
      },
      {
        onSuccess: () => {
          setLocalConnectStatus("connected");

          onSuccess({
            title: "Connected",
            message: "You are now connected",
          });

          queryClient.invalidateQueries({
            queryKey: ["matches", "connection-status", data.id],
          });
        },

        onError: () => {
          onFailure({
            title: "Failed",
            message: "Try again",
          });
        },

        onSettled: () => {
          setActionLoading(null);
        },
      },
    );
  };

  const handleReject = () => {
    if (!authDetails?.user) {
      setShowAuthModal(true);
      return;
    }

    if (!requestId) {
      onFailure({
        title: "Failed",
        message: "Could not find the request.",
      });
      return;
    }

    setActionLoading("reject");

    respondToMatchRequest.mutate(
      {
        request_id: requestId,
        action: "reject",
      },
      {
        onSuccess: () => {
          setLocalConnectStatus("idle");

          onSuccess({
            title: "Rejected",
            message: "Request rejected",
          });

          queryClient.invalidateQueries({
            queryKey: ["matches", "requests"],
          });

          queryClient.invalidateQueries({
            queryKey: ["matches", "connection-status", data.id],
          });
        },

        onError: () => {
          onFailure({
            title: "Failed",
            message: "Try again",
          });
        },

        onSettled: () => {
          setActionLoading(null);
        },
      },
    );
  };

  const handleShareProfile = async () => {
    if (!authDetails?.user) {
      setShowAuthModal(true);
      return;
    }

    const profileUrl = `${window.location.origin}/app/profile/${slugify(
      data?.name,
    )}_${data?.id}`;

    await shareProfile({
      title: `${data.name}'s Profile`,
      text: `Check out ${data.name}'s profile on Bouwnce`,
      url: profileUrl,
    });
  };

  return (
    <div className="bg-[#F7F7F7] p-3.75 w-full h-full">
      {/* PROFILE IMAGE */}
      <div className="hidden md:block">
        <ProfileImage
          user={{
            id: data.id,
            full_name: data?.name,
            profile_pic: data?.profile_pic,
          }}
          isOwnProfile={isOwnProfile}
        />
      </div>

      {/* NAME */}
      <div className="flex items-start justify-between gap-2 mt-6 md:mt-0 mb-4">
        <div>
          <h2 className="text-[18px] font-medium text-black leading-tight">
            {data.name}
          </h2>

          <p className="text-[#888888] text-[13px] break-all line-clamp-1">
            @{data.handle}
          </p>
        </div>

        {isOwnProfile && (
          <button
            onClick={() => setOpenEditProfile(true)}
            className="cursor-pointer shrink-0 w-8 h-8 rounded-full border border-[#00000014] bg-white hover:bg-[#f5f5f5] flex items-center justify-center transition-all"
          >
            <Pencil className="size-3.5 text-[#747474]" />
          </button>
        )}
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2 mb-5.5 items-center flex-wrap">
        {isOwnProfile ? (
          <button
            onClick={handleShareProfile}
            className="cursor-pointer max-w-17.5 h-6.5 flex-1 bg-[#D0D0D0] border border-white outline outline-[#747474] hover:bg-[#dedede] text-[#747474] p-2 rounded-full text-xs flex items-center justify-center transition-all"
          >
            <Send className="size-3.5 mr-1.75" />
            Share
          </button>
        ) : (
          <>
            {/* CONNECT BUTTON */}
            {!isPending &&
              !isConnected &&
              !isCheckingConnection &&
              (localConnectStatus !== "pending" || isTerminalRequestStatus) &&
              localConnectStatus !== "connected" && (
                <button
                  onClick={handleConnect}
                  disabled={
                    createMatchRequest.isPending ||
                    localConnectStatus === "loading"
                  }
                  className={`cursor-pointer max-w-22 h-7.5 flex-1 border border-[#F4F4F4] outline-[0.83px] p-2 rounded-full text-xs font-medium flex items-center justify-center transition-all ${
                    localConnectStatus === "loading"
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-orange text-white hover:bg-[#ee3d15]"
                  }`}
                >
                  {localConnectStatus === "loading" ? (
                    <Loader2 className="size-4 animate-spin mr-1.75 text-current" />
                  ) : (
                    <PlusCircle fill="#8a0202" className="size-4 mr-1.75" />
                  )}

                  {localConnectStatus === "loading" ? "Sending..." : "Connect"}
                </button>
              )}

            {/* CONNECTION STATUS LOADING */}
            {!isPending && !isConnected && isCheckingConnection && (
              <button
                disabled
                className="max-w-22 h-7.5 flex-1 border border-gray-200 bg-white text-gray-400 rounded-full text-xs flex items-center justify-center"
              >
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Checking...
              </button>
            )}

            {/* OUTGOING PENDING */}
            {!isConnected &&
              (isOutgoing ||
                (localConnectStatus === "pending" &&
                  !isTerminalRequestStatus)) && (
                <button
                  disabled
                  className="max-w-22 h-7.5 flex-1 bg-amber-100/40 text-amber-700 border-[0.53px] border-amber-700 rounded-full text-xs flex items-center justify-center"
                >
                  Pending
                </button>
              )}

            {/* INCOMING REQUEST */}
            {!isConnected && isIncoming && (
              <>
                <button
                  onClick={handleAccept}
                  disabled={actionLoading !== null}
                  className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-full border border-green-200 bg-green-50 text-green-600 hover:bg-green-100 transition disabled:opacity-60"
                >
                  {actionLoading === "accept" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                </button>

                <button
                  onClick={handleReject}
                  disabled={actionLoading !== null}
                  className="cursor-pointer w-9 h-9 flex items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition disabled:opacity-60"
                >
                  {actionLoading === "reject" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <X className="size-4" />
                  )}
                </button>
              </>
            )}

            {/* CONNECTED */}
            {(isConnected || localConnectStatus === "connected") && (
              <button
                disabled={actionLoading !== null}
                className="cursor-pointer font-medium max-w-23.25 h-7.5 flex-1 bg-white border-[0.83px] border-black outline outline-[#747474] hover:bg-[#dedede] text-black p-2 rounded-full text-xs flex items-center justify-center transition-all"
              >
                {actionLoading === "reject" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <MinusCircle className="size-3.5 mr-1.75" />
                )}
                Unmatch
              </button>
            )}

            {/* MESSAGE */}
            {authDetails?.user && (
              <button
                onClick={() => router.push(`/app/chat/${data.id}`)}
                className="cursor-pointer max-w-23.25 h-7.5 flex-1 bg-[#D0D0D0] border border-white outline outline-[#747474] hover:bg-[#dedede] text-[#747474] p-2 rounded-full text-xs flex items-center justify-center transition-all"
              >
                <MessageCircleReply className="size-3.5 mr-1.75" />
                Message
              </button>
            )}

            {/* MORE BUTTON */}
            <button className="cursor-pointer ml-auto bg-[#D9D9D9] flex items-center justify-center text-black rounded-full hover:bg-[#c6c4c4] transition-colors w-6 h-6">
              <MoreHorizontal className="size-3" />
            </button>
          </>
        )}
      </div>

      {/* STATS */}
      <div className="flex flex-wrap justify-between gap-2 text-[13px] mb-5 text-[#888888]">
        <span className="flex items-center gap-1">
          {isConnectionLoading ? (
            <div className="h-3 w-6 bg-gray-200 animate-pulse rounded" />
          ) : (
            <b className="font-normal">{data.followers}</b>
          )}{" "}
          Connections
        </span>

        <span>
          <b className="font-normal">{data.badges}</b> Profile Views
        </span>
      </div>

      {/* BIO */}
      <p className="text-[13px] text-black leading-4.5 w-[90%] border-b-[0.53px] border-[#00000033] pb-2.75 mb-11.5">
        {data.bio}
      </p>

      <EditProfileModal
        open={openEditProfile}
        onClose={() => setOpenEditProfile(false)}
        user={data}
        isOwnProfile={isOwnProfile}
      />
    </div>
  );
};

export default IdentityCard;
