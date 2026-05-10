"use client";

import { toast } from "react-toastify";
import { motion } from "framer-motion";

const MessageToast = ({ senderName, message, avatar }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.25 }}
      className="
        flex items-start gap-3
        p-3 min-w-70
        bg-white/90 backdrop-blur-xl
        border border-gray-200
        rounded-2xl
        shadow-xl
      "
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
        {avatar ? (
          <img
            src={avatar}
            className="w-full h-full object-cover"
            alt="avatar"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-600">
            {senderName?.[0]}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {senderName}
          </p>
          <span className="text-[10px] text-gray-400">now</span>
        </div>

        <p className="text-xs text-gray-600 line-clamp-2 mt-1">{message}</p>
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
      toastId: conversationId, // prevent duplicates
      position: "top-right",
      autoClose: 5000,
      closeOnClick: true,
      pauseOnHover: true,
    },
  );
};

export default MessageToast;
