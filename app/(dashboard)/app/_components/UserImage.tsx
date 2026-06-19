"use client";

import { useState } from "react";
import { X, MessageCircle, Share2, Phone } from "lucide-react";
import SafeImage from "@/app/_components/SafeImage";
import { slugify } from "@/app/_utils/slugify";
import { useChatUtils } from "@/app/context/ChatContext";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Portal } from "@/app/protocols/Portal";

interface UserImageProps {
  user: {
    id?: string;
    full_name: string;
    profile_pic?: { url?: string };
  };
  size?: number;
  style?: any;
  rounded?: string;
  clickable?: boolean;
}

const UserImage = ({
  user,
  size = 36,
  style = {
    boxShadow:
      "0px 0px 2.03px 0.51px #00000040, 0.51px -3.05px 2.03px 1.52px #00000040 inset",
  },
  rounded = "rounded-xl",
  clickable = true,
}: UserImageProps) => {
  const { authDetails } = useAuth();

  const isMyProfile =
    authDetails?.user?.id &&
    user?.id &&
    String(authDetails.user.id) === String(user.id);

  const { onlineUsers } = useChatUtils();
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const isOnline = !!user?.id && !!onlineUsers?.[user.id];
  const initials = user?.full_name?.trim()?.slice(0, 2)?.toUpperCase() || "NA";
  const navigateToProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
    router.push(`/app/profile/${slugify(user?.full_name)}_${user?.id}`);
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
    // Navigate to chat or trigger message action
    router.push(`/app/chat/${user?.id}`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const profileUrl = `${window.location.origin}/app/profile/${slugify(
      user.full_name,
    )}_${user.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: user.full_name,
          url: profileUrl,
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
      }
    } catch {}
  };
  return (
    <>
      {/* 1. Thumbnail Trigger */}
      <div
        onClick={(e) => {
          if (!clickable) return;
          e.stopPropagation();
          setIsExpanded(true);
        }}
        className={`cursor-pointer relative shrink-0 border border-white bg-gray-100 ${rounded} `}
        style={{ ...style, width: size, height: size }}
      >
        {user?.profile_pic?.url ? (
          <SafeImage
            src={user.profile_pic.url}
            alt={user.full_name}
            width={size}
            height={size}
            className={`object-cover rounded-xl`}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-gray-100 font-semibold text-black rounded-xl"
            style={{ maxWidth: size, maxHeight: size }}
          >
            {initials}
          </div>
        )}
        {isOnline && (
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border border-white rounded-full" />
        )}
      </div>

      {/* 2. Full Screen Overlay */}
      {isExpanded && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setIsExpanded(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="
          relative
          w-full
          max-w-md
          overflow-hidden
          rounded-3xl
          bg-white
          shadow-[0_25px_80px_rgba(0,0,0,0.25)]
          animate-in
          fade-in
          zoom-in-95
          duration-300
        "
            >
              {/* Close */}
              <button
                onClick={() => setIsExpanded(false)}
                className="
            absolute
            right-4
            top-4
            z-20
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            bg-black/20
            text-white
            backdrop-blur-md
            transition
            hover:bg-black/30
          "
              >
                <X size={18} />
              </button>

              {/* Cover */}
              <div className="relative h-72 overflow-hidden">
                {user?.profile_pic?.url ? (
                  <img
                    src={user.profile_pic.url}
                    alt={user.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-linear-to-br from-slate-200 to-slate-300">
                    <span className="text-7xl font-bold text-slate-500">
                      {initials}
                    </span>
                  </div>
                )}

                {/* Gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />

                {/* User info overlay */}
                <div className="absolute bottom-5 left-5 right-5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-16 w-16 overflow-hidden rounded-full border-4 border-white shadow-xl">
                        {user?.profile_pic?.url ? (
                          <img
                            src={user.profile_pic.url}
                            alt={user.full_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white font-bold">
                            {initials}
                          </div>
                        )}
                      </div>

                      {isOnline && (
                        <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-green-500" />
                      )}
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {user.full_name}
                      </h2>

                      <p className="text-sm text-white/80">
                        {isOnline ? "Active now" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6">
                <div className="flex gap-3">
                  <button
                    onClick={isMyProfile ? handleShare : handleMessage}
                    className="
    flex-1
    rounded-[10px]
    bg-green-500
    px-4
    py-2
    font-semibold
    cursor-pointer
    text-white
    transition-all
    hover:bg-green-600
    hover:scale-[1.02]
    active:scale-[0.98]
  "
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isMyProfile ? (
                        <>
                          <Share2 size={18} className="hidden md:block" />
                          Share Profile
                        </>
                      ) : (
                        <>
                          <MessageCircle
                            size={18}
                            className="hidden md:block"
                          />
                          Message
                        </>
                      )}
                    </div>
                  </button>

                  <button
                    onClick={navigateToProfile}
                    className="
                flex-1
                rounded-[10px]
                border
                border-slate-200
                bg-slate-50
                px-4
                py-2
                font-semibold cursor-pointer
                text-slate-700
                transition-all
                hover:bg-slate-100
              "
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

export default UserImage;
