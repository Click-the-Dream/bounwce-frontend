"use client";

import { toast } from "react-toastify";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import UserImage from "../(dashboard)/app/_components/UserImage";
import { useNotifications } from "../context/NotificationContext";
import audioController from "./audioController";

const MessageToast = ({ senderName, message, profile_pic }: any) => {
  useEffect(() => {
    audioController.play("/audio/bell.mp3");
  }, []);

  return (
    <div className="group relative flex w-[340px] max-w-[calc(100vw-24px)] items-center gap-3 overflow-hidden rounded-2xl border border-black/[0.06] bg-white/95 px-3.5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl">
      <div className="absolute inset-y-0 left-0 w-1 bg-orange" />

      <UserImage
        user={{ full_name: senderName, profile_pic }}
        size={40}
        rounded="h-10 w-10 rounded-full object-cover"
      />

      <div className="min-w-0 flex-1 pr-1">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-gray-950">
            {senderName || "New message"}
          </p>
          <span className="shrink-0 text-[10px] font-medium text-gray-400">
            now
          </span>
        </div>
        <p className="mt-0.5 truncate text-[12px] leading-5 text-gray-500">
          {message || "Sent you a message"}
        </p>
      </div>

      <span className="h-2 w-2 shrink-0 rounded-full bg-orange" />
    </div>
  );
};

const ToastContent = ({ senderName, message, userId, profile_pic, toastId }: any) => {
  const router = useRouter();
  const { resetUnread } = useNotifications();

  const openChat = async () => {
    toast.dismiss(toastId);
    resetUnread(userId);
    router.push(`/app/chat/${userId}`);
  };

  return (
    <button
      type="button"
      onClick={openChat}
      className="block cursor-pointer text-left outline-none transition-transform active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-orange/30"
      aria-label={`Open conversation with ${senderName}`}
    >
      <MessageToast
        senderName={senderName}
        message={message}
        profile_pic={profile_pic}
      />
      <span className="absolute right-2.5 top-2.5 hidden rounded-full bg-white/90 p-1.5 text-gray-400 shadow-sm group-hover:block" />
    </button>
  );
};

export const onMessageToast = ({
  senderName,
  message,
  userId,
  conversationId,
  profile_pic,
}: {
  senderName: string;
  message: string;
  avatar?: string;
  userId: string;
  conversationId: string;
  profile_pic?: { url: string };
}) => {
  const toastId = `chat:${conversationId || userId}`;
  const content = (
    <ToastContent
      senderName={senderName}
      message={message}
      userId={userId}
      profile_pic={profile_pic}
      toastId={toastId}
    />
  );

  if (toast.isActive(toastId)) {
    toast.update(toastId, {
      render: content,
      autoClose: 3500,
    });
    return;
  }

  toast(content, {
    toastId,
    position: "top-right",
    autoClose: 3500,
    hideProgressBar: true,
    closeButton: false,
    pauseOnHover: true,
    pauseOnFocusLoss: true,
    draggable: true,
    closeOnClick: false,
  });
};
