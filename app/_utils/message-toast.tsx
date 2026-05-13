"use client";

import { toast } from "react-toastify";
import { motion } from "framer-motion";

const MessageToast = ({ senderName, message, avatar, onDismiss }: any) => {
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
      exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.12 } }}
      className="
        w-65
        h-12
        flex items-center gap-2.5
        px-2.5
        rounded-lg
        bg-background
        text-foreground
        border border-lighter-ash/40
        dark:border-white/10
        shadow-[0_8px_20px_rgba(0,0,0,0.08)]
        dark:shadow-[0_8px_20px_rgba(0,0,0,0.45)]
        overflow-hidden
      "
    >
      {/* avatar */}
      <div className="relative w-8 h-8 shrink-0">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-lighter-ash">
          {avatar ? (
            <img src={avatar} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-brand-orange text-white text-xs font-semibold">
              {senderName?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* tiny live dot */}
        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
      </div>

      {/* text */}
      <div className="flex-1 min-w-0 leading-tight">
        <p className="text-[12px] font-semibold truncate">{senderName}</p>

        <p className="text-[11px] text-ash truncate">{message}</p>
      </div>

      {/* micro indicator */}
      <span className="w-1.5 h-1.5 rounded-full bg-brand-orange animate-bounce" />
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
      className: "!bg-transparent !shadow-none !p-0 !min-h-0",
    },
  );
};

export default MessageToast;
