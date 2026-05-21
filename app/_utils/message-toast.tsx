"use client";

import { toast } from "react-toastify";
import { motion } from "framer-motion";
import notificationSound from "@/app/assets/audio/bell.mp4";
import { useEffect } from "react";
import audioController from "./audioController";

const MessageToast = ({ senderName, message, avatar, onDismiss }: any) => {
  // play sound ONCE when toast mounts
  useEffect(() => {
    audioController.play(notificationSound);

    return () => {
      audioController.stop();
    };
  }, []);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.x) > 100) onDismiss?.();
      }}
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 600, damping: 35 },
      }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      className="w-65 h-12 flex items-center gap-2.5 px-2.5 rounded-lg bg-background"
    >
      {/* avatar */}
      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
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
    </motion.div>
  );
};

export const onMessageToast = ({
  senderName,
  message,
  avatar,
  onClick,
  conversationId,
}: any) => {
  toast(
    <div onClick={onClick} className="cursor-pointer">
      <MessageToast senderName={senderName} message={message} avatar={avatar} />
    </div>,
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
