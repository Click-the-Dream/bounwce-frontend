"use client";

import { toast } from "react-toastify";
import { useEffect } from "react";
import audioController from "./audioController";
import { useRouter } from "next/navigation";
import UserImage from "../(dashboard)/app/_components/UserImage";
import { useChatUtils } from "../context/ChatContext";
import { useNotifications } from "../context/NotificationContext";

const MessageToast = ({ senderName, message, profile_pic, userId }: any) => {
  // play sound ONCE when toast mounts
  useEffect(() => {
    audioController.play("/audio/bell.mp3");

    return () => {
      audioController.stop();
    };
  }, []);

  return (
    <div className="w-65 h-12 flex items-center gap-2.5 px-2.5 rounded-lg bg-slate-100">
      {/* avatar */}
      <UserImage
        user={{
          id: userId,
          full_name: senderName,
          profile_pic: profile_pic,
        }}
        size={32}
        rounded="w-full h-full object-cover rounded-full"
      />

      {/* text */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold truncate text-black">
          {senderName}
        </p>

        <p className="text-[11px] truncate text-gray-500">{message}</p>
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
      toastId: `${conversationId}-${Date.now()}`,
      autoClose: 3500,
      hideProgressBar: true,
      closeButton: false,
      pauseOnHover: true,
      draggable: true,
    },
  );
};
