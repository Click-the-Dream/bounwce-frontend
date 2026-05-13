"use client";

import { motion, AnimatePresence } from "framer-motion";

export const ConnectionStatusToast = ({
  state,
}: {
  state: "connecting" | "connected" | "reconnecting" | "disconnected";
}) => {
  const map = {
    connecting: {
      text: "Connecting…",
      color: "bg-amber-500",
    },
    reconnecting: {
      text: "Reconnecting…",
      color: "bg-orange-500",
    },
    connected: {
      text: "Connected",
      color: "bg-green-500",
    },
    disconnected: {
      text: "Disconnected",
      color: "bg-red-500",
    },
  };

  const s = map[state];

  return (
    <AnimatePresence>
      {state !== "connected" && (
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="
            fixed top-2 left-1/2 -translate-x-1/2
            z-[9999]
            px-3 py-1.5
            rounded-full
            text-xs font-medium text-white
            shadow-lg
            flex items-center gap-2
          "
        >
          <span className={`w-2 h-2 rounded-full ${s.color} animate-pulse`} />
          {s.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
