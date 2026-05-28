"use client";

import {
  Check,
  Loader2,
  MessageCircleReply,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Send,
  X,
} from "lucide-react";
import React, { useState } from "react";
import SwitchAccountCard from "./SwitchAccountCard";
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

type Props = {
  data: any;
  isOwnProfile: boolean;
  isLoading?: boolean;
};

const IdentityCard: React.FC<Props> = ({ data, isOwnProfile, isLoading }) => {
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

  const { createMatchRequest, useGetMatchRequests, respondToMatchRequest } =
    useMatch();
  const { data: appRequests } = useGetMatchRequests({
    enabled: !isOwnProfile,
  });
  const matchRequests = appRequests?.items || [];

  if (isLoading) return <IdentityCardSkeleton />;

  const relation = matchRequests?.find((req: any) => {
    return (
      (req.target_user?.id === data.id &&
        req.requester?.d === authDetails?.user?.id) ||
      (req.requester?.id === data.id &&
        req.target_user?.id === authDetails?.user?.id)
    );
  });

  const status = relation?.status;

  const isRequester = relation?.requester_id === authDetails?.user?.id;

  const isPending = status === "pending";

  const isIncoming = isPending && !isRequester;

  const isOutgoing = isPending && isRequester;

  const isConnected = status === "accepted";

  const handleConnect = () => {
    if (!authDetails?.user) {
      setShowAuthModal(true);
      return;
    }
    if (relation || createMatchRequest.isPending) return;

    setLocalConnectStatus("loading");

    createMatchRequest.mutate(
      { target_user_id: data.id },
      {
        onSuccess: () => {
          setLocalConnectStatus("pending");
          onSuccess({
            title: "Connection Request Sent",
            message: "Request sent successfully.",
          });

          queryClient.invalidateQueries();
          router.push(`/app/chat/${data.id}`);
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
    setActionLoading("accept");

    respondToMatchRequest.mutate(
      {
        request_id: relation.request_id,
        action: "accept",
      },
      {
        onSuccess: () => {
          onSuccess({
            title: "Connected",
            message: "You are now connected",
          });
          queryClient.invalidateQueries();
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
    setActionLoading("reject");

    respondToMatchRequest.mutate(
      {
        request_id: relation.request_id,
        action: "reject",
      },
      {
        onSuccess: () => {
          onSuccess({
            title: "Rejected",
            message: "Request rejected",
          });
          queryClient.invalidateQueries();
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
    const profileUrl = `${window.location.origin}/app/profile/${slugify(data?.name)}_${data?.id}`;
    await shareProfile({
      title: `${data.name}'s Profile`,
      text: `Check out ${data.name}'s profile on Bouwnce`,
      url: profileUrl,
    });
  };
  return (
    <div className="bg-[#F7F7F7] p-3.75 w-full h-full">
      {/* PROFILE IMAGE */}
      <ProfileImage
        user={{
          id: data.id,
          full_name: data?.name,
          profile_pic: data?.profile_pic,
        }}
        isOwnProfile={isOwnProfile}
      />

      {/* NAME */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h2 className="text-[18px] font-medium text-black leading-tight">
            {data.name}
          </h2>

          <p className="text-[#888888] text-[13px]">@{data.handle}</p>
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
      <div className="flex gap-2 mb-5.5 items-center">
        {isOwnProfile ? (
          <button
            onClick={handleShareProfile}
            className="cursor-pointer max-w-17.5 h-6.5 flex-1 bg-[#D0D0D0] border border-white outline outline-[#747474] hover:bg-[#dedede] text-[#747474] p-2 rounded-full text-xs flex items-center justify-center transition-all"
          >
            <Send className="size-3.5 mr-1.75" /> Share
          </button>
        ) : (
          <>
            {/* CONNECT BUTTON */}
            {!relation &&
              localConnectStatus !== "pending" &&
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

            {/* OUTGOING PENDING */}
            {(isOutgoing || localConnectStatus === "pending") && (
              <button
                disabled
                className="max-w-22 h-7.5 flex-1 bg-amber-100/40 text-amber-700 border-[0.53px] border-amber-700 rounded-full text-xs flex items-center justify-center"
              >
                Pending
              </button>
            )}

            {/* INCOMING */}
            {isIncoming && (
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
                disabled
                className="cursor-pointer max-w-22 h-7.5 flex-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center justify-center"
              >
                Connected
              </button>
            )}

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
      <div className="flex justify-between text-[13px] mb-5 text-[#888888]">
        <span>
          <b className="font-normal">{data.followers}</b> Connections
        </span>
        <span>
          <b className="font-normal">{data.badges}</b> Profile Views
        </span>
      </div>

      {/* BIO */}
      <p className="text-[13px] text-black leading-4.5 w-[90%] border-b-[0.53px] border-[#00000033] pb-2.75 mb-11.5">
        {data.bio}
      </p>

      {/* SWITCH ACCOUNT */}
      {/* {isOwnProfile && <SwitchAccountCard />} */}

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
