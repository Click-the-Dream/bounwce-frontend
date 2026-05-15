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
import userImg from "../../../../assets/buyer/user.jpg";
import Image from "next/image";
import SwitchAccountCard from "./SwitchAccountCard";
import IdentityCardSkeleton from "./IdentityCardSkeleton";
import useMatch from "@/app/hooks/use-match";
import useUser from "@/app/hooks/use-user";
import { onFailure, onSuccess } from "@/app/_utils/notification";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Cropper from "react-easy-crop";

type Props = {
  data: any;
  isOwnProfile?: boolean;
  isLoading?: boolean;
};

const IdentityCard: React.FC<Props> = ({
  data,
  isOwnProfile,
  isLoading,
}) => {
  const { authDetails } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { uploadProfilePicture } = useUser();

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [localConnectStatus, setLocalConnectStatus] = useState<
    "idle" | "loading" | "connected"
  >("idle");

  const { createMatchRequest, useGetMatchRequests, respondToMatchRequest } =
    useMatch();
  const { data: matchRequests } = useGetMatchRequests();

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
      req.target_user_id === data.id ||
      (req.requester_id === data.id &&
        req.target_user_id === authDetails?.user?.id)
    );
  });

  const status = relation?.status;
  const isRequester =
    relation?.target_user_id !== authDetails?.user?.id;
  const isPending = status === "pending";
  const isConnected =
    status === "accepted" || (isPending && isRequester);
  const isIncoming = isPending && !isRequester;

  const handleConnect = () => {
    if (relation || createMatchRequest.isPending) return;

    setLocalConnectStatus("loading");

    createMatchRequest.mutate(
      { target_user_id: data.id },
      {
        onSuccess: () => {
          setLocalConnectStatus("connected");
          onSuccess({
            title: "Connection Request Sent",
            message: "Request sent successfully.",
          });

          queryClient.invalidateQueries();
          router.push(`/buyer/chat/${data.id}`);
        },
        onError: () => {
          setLocalConnectStatus("idle");
          onFailure({
            title: "Failed",
            message: "Could not send request.",
          });
        },
      }
    );
  };

  const handleAccept = () => {
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
      }
    );
  };

  const handleReject = () => {
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
      }
    );
  };

  // IMAGE PICK
  const handlePickImage = (e: any) => {
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
      const image = new Image();
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
        croppedAreaPixels.height
      );

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b as Blob), "image/jpeg")
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
      <div className="relative w-15.75 h-15.25 mb-3.25">
        <Image
          src={data.profile_pic?.url || userImg.src}
          alt="Profile"
          width={60}
          height={61}
          className="rounded-[20px] border-2 border-white object-cover w-15 h-15.25"
        />

        <div
          onClick={() => fileRef.current?.click()}
          className="w-5 h-5 absolute -bottom-1 -right-1 bg-[#D9D9D9] p-1.5 rounded-md shadow-md border border-white flex items-center justify-center cursor-pointer"
        >
          <ImageIcon size={10} />
        </div>
      </div>

      {/* NAME */}
      <h2 className="text-[18px] font-medium">{data.name}</h2>
      <p className="text-[#888888] text-[13px] mb-4">
        @{data.handle}
      </p>

      {/* ACTIONS (UNCHANGED) */}
      <div className="flex gap-2 mb-5.5 items-center">
        {!isOwnProfile && (
          <>
            <button
              onClick={handleConnect}
              className="bg-orange text-white px-3 py-1 rounded-full text-xs"
            >
              Connect
            </button>

            <button
              onClick={() =>
                router.push(`/buyer/chat/${data.id}`)
              }
              className="bg-gray-300 px-3 py-1 rounded-full text-xs"
            >
              Message
            </button>
          </>
        )}
      </div>

      {/* SWITCH ACCOUNT */}
      {isOwnProfile && <SwitchAccountCard />}

      {/* CROPPER MODAL */}
      {openCrop && (
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
              <button
                onClick={() => setOpenCrop(false)}
                className="text-sm"
              >
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