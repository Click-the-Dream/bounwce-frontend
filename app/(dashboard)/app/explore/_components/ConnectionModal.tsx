"use client";

import { useEffect, useRef, useState } from "react";

interface ConnectionModalProps {
  isOpen: boolean;
  userName: string;
  userInitials: string;
  onGoToChat: () => void;
  onDismiss: () => void;
  autoRedirectSeconds?: number;
}

const ConnectionModal = ({
  isOpen,
  userName,
  userInitials,
  onGoToChat,
  onDismiss,
  autoRedirectSeconds = 4,
}: ConnectionModalProps) => {
  const [countdown, setCountdown] = useState(autoRedirectSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(autoRedirectSeconds);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setCountdown(autoRedirectSeconds);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-6 sm:pb-0"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        {/* Progress bar */}
        <div className="h-0.5 bg-gray-100 w-full">
          <div
            className="h-full bg-emerald-500 transition-none"
            style={{
              width: `${((autoRedirectSeconds - countdown) / autoRedirectSeconds) * 100}%`,
              transition: "width 1s linear",
            }}
          />
        </div>

        <div className="px-6 pt-7 pb-6 text-center">
          {/* Avatar */}
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-medium text-lg">
              {userInitials}
            </div>
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center">
              <svg
                className="w-2.5 h-2.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </span>
          </div>

          {/* Status pill */}
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1 rounded-full mb-3">
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            Request sent
          </span>

          <h2 className="text-[17px] font-medium text-gray-900 mb-1.5">
            You connected with {userName}
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-5">
            Your request is pending. You can start a conversation while you wait
            for them to respond.
          </p>

          {/* Countdown hint */}
          <p className="text-xs text-gray-400 mb-4">
            {countdown > 0
              ? `Taking you to chat in ${countdown}s…`
              : "Redirecting…"}
          </p>

          {/* CTAs */}
          <button
            onClick={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              onGoToChat();
            }}
            className="w-full bg-black text-white text-sm font-medium py-3 rounded-xl mb-2.5 hover:bg-gray-800 active:scale-[0.98] transition-all"
          >
            Go to chat now
          </button>
          <button
            onClick={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              onDismiss();
            }}
            className="w-full bg-transparent text-gray-500 text-sm border border-gray-200 py-3 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            Stay on explore
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionModal;
