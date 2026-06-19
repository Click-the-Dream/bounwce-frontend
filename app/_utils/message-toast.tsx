"use client";

import { toast } from "react-toastify";
import { useEffect } from "react";
import audioController from "./audioController";
import { useRouter } from "next/navigation";
import UserImage from "../(dashboard)/app/_components/UserImage";
import { useChatUtils } from "../context/ChatContext";
import { useNotifications } from "../context/NotificationContext";

const MessageToast = ({ senderName, message, profile_pic, userId }: any) => {
  useEffect(() => {
    audioController.play("/audio/bell.mp3");
    return () => audioController.stop();
  }, []);

  return (
    <div
      className="relative flex items-center gap-3 pl-3 pr-4 py-2.5 bg-white shadow-2xl rounded-[10px] overflow-hidden w-75 max-w-[calc(100vw-32px)]"
      style={{
        border: "1px solid #f0f0f0",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
      }}
    >
      {/* Bounce orange left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3.5px] rounded-l-[14px]"
        style={{ background: "var(--color-orange)" }}
      />

      {/* Avatar */}
      <div className="flex-shrink-0 ml-2">
        <UserImage
          user={{ id: userId, full_name: senderName, profile_pic }}
          size={38}
          rounded="w-full h-10 object-cover rounded-full"
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-[13px] font-semibold truncate text-[#1a1a1a]">
            {senderName}
          </p>
          <span className="text-[11px] text-[#aaa] flex-shrink-0">now</span>
        </div>
        <p className="text-[12px] truncate text-[#777] m-0">{message}</p>
      </div>
    </div>
  );
};

const ToastContent = ({ senderName, message, userId, profile_pic }: any) => {
  const router = useRouter();
  const { prewarmMessages } = useChatUtils();
  const { resetUnread } = useNotifications();
  return (
    <div
      onClick={async () => {
        toast.dismiss();
        await prewarmMessages(userId);
        resetUnread(userId);
        router.push(`/app/chat/${userId}`);
      }}
      className="cursor-pointer active:scale-[0.98] transition-transform"
    >
      <MessageToast
        senderName={senderName}
        message={message}
        userId={userId}
        profile_pic={profile_pic}
      />
    </div>
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
  avatar: string;
  userId: string;
  conversationId: string;
  profile_pic: {
    url: string;
  };
}) => {
  toast(
    <ToastContent
      senderName={senderName}
      message={message}
      userId={userId}
      profile_pic={profile_pic}
    />,
    {
      position: "top-right",
      toastId: `${conversationId}-${Date.now()}`,
      autoClose: 3500,
      hideProgressBar: true,
      closeButton: false,
      pauseOnHover: true,
      draggable: true,
    },
  );
};
