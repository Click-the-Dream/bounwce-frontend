"use client";

import { useState } from "react";
import { X, MessageCircle, Share2, User as UserIcon } from "lucide-react";
import SafeImage from "@/app/_components/SafeImage";
import { slugify } from "@/app/_utils/slugify";
import { useChatUtils } from "@/app/context/ChatContext";
import { useAuth } from "@/app/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { Portal } from "@/app/protocols/Portal";

interface UserImageProps {
  user: {
    id?: string;
    full_name: string;
    profile_pic?: { url?: string };
  };
  size?: number;
  style?: React.CSSProperties;
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
  const pathname = usePathname();
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

  const isCurrentProfilePage = pathname.includes("/app/profile");

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(false);
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
        className={`cursor-pointer relative shrink-0 border border-white bg-slate-100 ${rounded} transition-transform hover:scale-[1.03] active:scale-[0.97]`}
        style={{ ...style }}
      >
        {user?.profile_pic?.url ? (
          <SafeImage
            src={user.profile_pic.url}
            alt={user.full_name}
            width={size}
            height={size}
            className={`object-cover ${rounded}`}
            style={{ width: size, height: size }}
          />
        ) : (
          <div
            className="flex items-center justify-center bg-slate-100 font-semibold text-slate-800 rounded-xl"
            style={{ width: size, height: size }}
          >
            {initials}
          </div>
        )}
        {isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
      </div>

      {/* 2. Redesigned Overlay Card */}
      {isExpanded && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 transition-all"
            onClick={() => setIsExpanded(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsExpanded(false)}
                className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md ring-1 ring-white/20 transition hover:bg-black/60 active:scale-95"
              >
                <X size={18} />
              </button>

              {/* Banner / Image Display */}
              <div className="relative h-80 w-full bg-slate-900">
                {user?.profile_pic?.url ? (
                  <img
                    src={user.profile_pic.url}
                    alt={user.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-linear-to-tr from-slate-800 to-slate-700">
                    <span className="text-6xl font-bold tracking-widest text-slate-300">
                      {initials}
                    </span>
                  </div>
                )}

                {/* Subtle Gradient Gradient Overlay for Text Visibility */}
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                {/* User Info Overlay */}
                <div className="absolute bottom-4 left-5 right-5 space-y-1">
                  <h2 className="text-2xl font-bold tracking-tight text-white">
                    {user.full_name}
                  </h2>
                  {isOnline ? (
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 backdrop-blur-md ring-1 ring-emerald-500/20">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                      </span>
                      Active now
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300">Offline</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-white">
                <div className="flex items-center gap-2">
                  {isCurrentProfilePage ? (
                    <button
                      onClick={handleShare}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-600 active:scale-[0.98]"
                    >
                      <Share2 size={18} />
                      Share Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleMessage}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-600 active:scale-[0.98]"
                      >
                        <MessageCircle size={18} />
                        Message
                      </button>

                      <button
                        onClick={navigateToProfile}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]"
                      >
                        <UserIcon size={18} />
                        Profile
                      </button>
                    </>
                  )}
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
