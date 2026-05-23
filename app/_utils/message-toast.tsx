"use client";

import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useEffect } from "react";
import audioController from "./audioController";
import { useRouter } from "next/navigation";

const MessageToast = ({ senderName, message, avatar, onDismiss }: any) => {
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
      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-400">
        {avatar ? (
          <img src={avatar} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold">
            {senderName?.[0]}
          </div>
        )}
      </div>

      {/* text */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold truncate">{senderName}</p>

        <p className="text-[11px] truncate text-gray-500">{message}</p>
      </div>
    </div>
  );
};

const ToastContent = ({ senderName, message, avatar, userId }: any) => {
  const router = useRouter();

  return (
    <div
      onClick={() => {
        toast.dismiss();
        router.push(`/app/chat/${userId}`);
      }}
      className="cursor-pointer active:scale-[0.98] transition-transform"
    >
      <MessageToast senderName={senderName} message={message} avatar={avatar} />
    </div>
  );
};

export const onMessageToast = ({
  senderName,
  message,
  avatar,
  userId,
  conversationId,
}: any) => {
  toast(
    <ToastContent
      senderName={senderName}
      message={message}
      avatar={avatar}
      userId={userId}
    />,
    {
      toastId: `${conversationId}-${Date.now()}`,
      position: "top-right",
      autoClose: 3500,
      hideProgressBar: true,
      closeButton: false,
      pauseOnHover: true,
      draggable: true,
      className: "!bg-transparent !shadow-none !p-0",
    },
  );
};
