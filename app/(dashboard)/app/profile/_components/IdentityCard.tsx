"use client";

import {
  Check,
  Image as ImageIcon,
  Loader2,
  MessageCircleReply,
  MoreHorizontal,
  PlusCircle,
  Send,
  X,
} from "lucide-react";
import React, { useState, useRef } from "react";
import SwitchAccountCard from "./SwitchAccountCard";
import IdentityCardSkeleton from "./IdentityCardSkeleton";
import useMatch from "@/app/hooks/use-match";
import useUser from "@/app/hooks/use-user";
import { onFailure, onSuccess } from "@/app/_utils/notification";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Cropper from "react-easy-crop";
import SafeImage from "@/app/_components/SafeImage";
import { shareProfile } from "@/app/_utils/share";
import { slugify } from "@/app/_utils/slugify";
import UserImage from "../../_components/UserImage";

type Props = {
  data: any;
  isOwnProfile?: boolean;
  isLoading?: boolean;
};

const IdentityCard: React.FC<Props> = ({ data, isOwnProfile, isLoading }) => {
  const { authDetails } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { uploadProfilePicture } = useUser();

  const fileRef = useRef<HTMLInputElement | null>(null);

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

  // CROPPER STATES
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [openCrop, setOpenCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

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
  // IMAGE PICK
  const handlePickImage = (e: any) => {
    if (!isOwnProfile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setOpenCrop(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = (_: any, cropped: any) => {
    setCroppedAreaPixels(cropped);
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setUploading(true);

      const canvas = document.createElement("canvas");
      const image = new window.Image();
      image.src = imageSrc;

      await new Promise((resolve) => (image.onload = resolve));

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      const ctx = canvas.getContext("2d")!;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
      );

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b as Blob), "image/jpeg"),
      );

      const file = new File([blob], "profile.jpg", {
        type: "image/jpeg",
      });

      await uploadProfilePicture.mutateAsync(file);

      setOpenCrop(false);
      setImageSrc(null);

      onSuccess({
        title: "Updated",
        message: "Profile image updated",
      });
    } catch (err) {
      onFailure({
        title: "Upload Failed",
        message: "Try again",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleShareProfile = async () => {
    const profileUrl = `${window.location.origin}/app/profile/${slugify(data?.name)}_${data?.id}`;
    await shareProfile({
      title: `${data.name}'s Profile`,
      text: `Check out ${data.name}'s profile on Bouwnce`,
      url: profileUrl,
    });
  };
  return (
    <div className="bg-[#F7F7F7] p-3.75 w-full h-full">
      {/* HIDDEN INPUT */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePickImage}
      />

      {/* PROFILE IMAGE */}
      <div className="w-12.5 relative mb-3.25">
        <UserImage
          user={{
            id: data.id,
            full_name: data?.name,
            profile_pic: data?.profile_pic,
          }}
          size={50}
        />

        {isOwnProfile && (
          <div
            onClick={() => fileRef.current?.click()}
            className="w-5 h-5 absolute -bottom-1 -right-1 bg-[#D9D9D9] p-1.5 rounded-md shadow-md border border-white flex items-center justify-center cursor-pointer"
          >
            <ImageIcon size={10} />
          </div>
        )}
      </div>

      {/* NAME */}
      <h2 className="text-[18px] font-medium text-black leading-tight">
        {data.name}
      </h2>
      <p className="text-[#888888] text-[13px] mb-4">@{data.handle}</p>

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

            <button
              onClick={() => router.push(`/app/chat/${data.id}`)}
              className="cursor-pointer max-w-23.25 h-7.5 flex-1 bg-[#D0D0D0] border border-white outline outline-[#747474] hover:bg-[#dedede] text-[#747474] p-2 rounded-full text-xs flex items-center justify-center transition-all"
            >
              <MessageCircleReply className="size-3.5 mr-1.75" />
              Message
            </button>

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
      {isOwnProfile && <SwitchAccountCard />}

      {/* CROPPER MODAL */}
      {isOwnProfile && openCrop && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white w-[90%] max-w-md p-4 rounded-lg">
            <div className="relative w-full h-72 bg-gray-100">
              <Cropper
                image={imageSrc || ""}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="mt-3 flex gap-2 justify-end">
              <button onClick={() => setOpenCrop(false)} className="text-sm">
                Cancel
              </button>

              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-orange text-white px-3 py-1 rounded text-sm"
              >
                {uploading ? "Uploading..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdentityCard;
