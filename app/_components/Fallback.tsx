"use client";

import { motion } from "framer-motion";
import Logo from "./common/Logo";

type FallbackProps = {
  message?: string;
  subMessage?: string;
};

function Fallback({
  message = "Loading...",
  subMessage = "Please wait while we prepare your experience",
}: FallbackProps) {
  return (
    <main className="w-full h-screen bg-linear-to-br from-orange/10 via-white/50 to-white relative overflow-hidden flex flex-col justify-center items-center">
      {/* Background ambience */}
      <div className="absolute w-75 h-75 rounded-full bg-orange/5 blur-3xl -top-12.5 -left-12.5" />
      <div className="absolute w-50 h-50 rounded-full bg-red-200/10 blur-2xl -bottom-10 -right-10" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center space-y-6 z-10 text-center"
      >
        {/* Logo */}
        <Logo size={90} />

        {/* Text */}
        <div className="space-y-1">
          <p className="text-gray-700 text-base md:text-lg font-semibold">
            {message}
          </p>

          <p className="text-gray-500 text-sm max-w-sm">{subMessage}</p>
        </div>

        {/* Loader */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute w-28 h-28 border-4 border-orange/20 rounded-full animate-ping-slow" />
          <div className="absolute w-20 h-20 border-4 border-red-300/40 rounded-full animate-ping-slower" />
          <div className="w-14 h-14 border-4 border-gray-200 border-t-orange rounded-full animate-spin" />
        </div>
      </motion.div>
    </main>
  );
}

export default Fallback;
