"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, AlertCircle } from "lucide-react";
import { LuClock } from "react-icons/lu";

import { useAuth } from "@/app/context/AuthContext";
import { getMessageLayout, renderCheck } from "@/app/_utils/formatters";
import { getFileIcon, getRadius } from "@/app/_utils/utility";
import SafeImage from "@/app/_components/SafeImage";
import SwipeableMessage from "./SwipeableMessage";
import ReplyPreview from "./ReplyPreview";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface ChatMediaMessageProps {
  msg: any;
  onOpen?: (url: string) => void;
  onReply?: (msg: any) => void;
  onRetry?: (msg: any) => void;
  onScrollToMessage?: (messageId: string) => void;
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

const ChatMediaMessage = ({
  msg,
  onOpen,
  onReply,
  onRetry,
  onScrollToMessage,
}: ChatMediaMessageProps) => {
  const { authDetails } = useAuth();

  // ─── DERIVED ────────────────────────────────

  const isSender = msg.sender_id === authDetails?.user?.id;
  const styles = getMessageLayout(isSender);
  const caption = msg.body || msg.caption || "";

  // ─── STATE ──────────────────────────────────

  const [isFailed, setIsFailed] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  // ─── EFFECTS ────────────────────────────────

  // Mark as failed after 60s if still pending
  useEffect(() => {
    if (!isSender || !msg.pending) {
      setIsFailed(false);
      return;
    }

    setIsFailed(false);
    const timer = setTimeout(() => setIsFailed(true), 60_000);
    return () => clearTimeout(timer);
  }, [isSender, msg.pending, msg.id]);

  // Listen for highlight events from MessageList scroll-to-reply
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail?.messageId === msg.id) {
        setIsHighlighted(true);
        setTimeout(() => setIsHighlighted(false), 1500);
      }
    };
    window.addEventListener("highlight-message", handler as EventListener);
    return () =>
      window.removeEventListener("highlight-message", handler as EventListener);
  }, [msg.id]);

  // ─── DERIVED FLAGS ──────────────────────────

  const isUploading = isSender && msg.pending && !isFailed;

  const mediaUrls = useMemo(() => msg.media_urls || [], [msg.media_urls]);

  // ─── STATUS ─────────────────────────────────

  const renderStatus = () => {
    if (!isSender) return null;
    if (isFailed) return <AlertCircle size={12} className="text-red-500" />;
    if (msg.pending) return <LuClock size={10} />;
    if (msg.read_at) return renderCheck("read");
    return renderCheck("sent");
  };

  // ─── UPLOAD OVERLAY ─────────────────────────

  const renderUploadOverlay = () => {
    if (isFailed) {
      return (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-[10px] z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry?.(msg);
            }}
            className="flex flex-col items-center gap-1 text-white hover:scale-105 transition-transform"
          >
            <RefreshCw size={24} />
            <span className="text-[10px] font-bold uppercase">Retry</span>
          </button>
        </div>
      );
    }

    if (!isUploading) return null;

    return (
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[10px] z-10">
        <div className="flex flex-col items-center gap-1.5">
          <div className="w-8 h-8 rounded-full animate-spin border-2 border-emerald-100 border-t-emerald-600" />
          <span className="text-white text-[10px]">Sending...</span>
        </div>
      </div>
    );
  };

  // ─── MEDIA RENDERERS ────────────────────────

  const renderImageGrid = () => {
    if (mediaUrls.length === 1) {
      return (
        <div
          className="relative cursor-pointer"
          onClick={() => !isUploading && onOpen?.(mediaUrls[0])}
        >
          <SafeImage
            src={mediaUrls[0]}
            alt="chat"
            width={800}
            height={800}
            className="w-full h-88 object-cover rounded-[10px]"
            showLoader
          />
          {renderUploadOverlay()}
        </div>
      );
    }

    const gridClass =
      mediaUrls.length === 2
        ? "grid grid-cols-2 gap-0.5"
        : "grid grid-cols-2 gap-0.5 auto-rows-[110px]";

    return (
      <div className={`relative ${gridClass} rounded-[10px] overflow-hidden`}>
        {mediaUrls.slice(0, 4).map((url: string, i: number) => (
          <div
            key={i}
            className={`relative overflow-hidden cursor-pointer ${getRadius(i, mediaUrls.length)} ${
              mediaUrls.length === 3 && i === 2 ? "col-span-2" : ""
            }`}
            onClick={() => !isUploading && onOpen?.(url)}
          >
            <SafeImage
              src={url}
              alt="chat"
              width={500}
              height={500}
              className="w-full h-44 object-cover"
              showLoader
            />
            {i === 3 && mediaUrls.length > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xl font-semibold">
                +{mediaUrls.length - 4}
              </div>
            )}
          </div>
        ))}
        {renderUploadOverlay()}
      </div>
    );
  };

  const renderVideo = () => (
    <div className="relative rounded-[10px] overflow-hidden">
      <video
        src={mediaUrls[0]}
        className="w-full h-88 object-cover"
        controls={!isUploading}
      />
      {renderUploadOverlay()}
    </div>
  );

  const renderFile = () => {
    const FileIconComponent = getFileIcon(msg.file_name || "");
    return (
      <div className="relative">
        <a
          href={!isUploading ? mediaUrls[0] : "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => isUploading && e.preventDefault()}
          className={`flex items-center gap-3 p-3 bg-white/40 border-b border-black/5 ${
            isUploading ? "cursor-default" : "hover:bg-white/60 cursor-pointer"
          }`}
        >
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
            <FileIconComponent size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-gray-900 truncate">
              {msg.file_name || "Document"}
            </p>
            <p className="text-[11px] text-gray-500 uppercase">
              {isUploading
                ? "Sending..."
                : `${msg.file_size || "File"} • ${
                    msg.file_name?.split(".").pop()?.toUpperCase() ?? ""
                  }`}
            </p>
          </div>
          <div className="text-gray-400">
            {isUploading ? (
              <div className="w-4 h-4 rounded-full animate-spin border-2 border-emerald-100 border-t-emerald-600" />
            ) : (
              <Download size={16} />
            )}
          </div>
        </a>
        {renderUploadOverlay()}
      </div>
    );
  };

  // ─── RENDER ─────────────────────────────────

  return (
    <SwipeableMessage
      isSender={isSender}
      onReply={() => onReply?.(msg)}
      className={styles.container}
    >
      <div
        data-message-id={msg.id}
        className={`
          ${styles.bubble}
          p-0.5 relative w-71.25 rounded-[10px] overflow-hidden shadow-sm
          transition-colors duration-300
          ${isHighlighted ? "ring-2 ring-orange/60" : ""}
        `}
      >
        {/* Reply preview */}
        {msg.reply_to_message && (
          <div className="px-1.5 pt-1.5 pb-0">
            <ReplyPreview
              reply={msg.reply_to_message}
              isSender={isSender}
              onScrollToMessage={onScrollToMessage}
            />
          </div>
        )}

        {/* Media content */}
        {msg.media_type === "image"
          ? renderImageGrid()
          : msg.media_type === "video"
            ? renderVideo()
            : renderFile()}

        {/* Caption */}
        {caption && <div className="px-2.5 py-2 text-[13px]">{caption}</div>}

        {/* Time + status */}
        <span
          className={`absolute bottom-1 right-2 text-[10px] flex items-center gap-1 ${styles.time} drop-shadow-md`}
        >
          {msg?.created_at &&
            new Date(msg.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          {isSender && (
            <span className="text-[10px] opacity-80">{renderStatus()}</span>
          )}
        </span>
      </div>
    </SwipeableMessage>
  );
};

export default ChatMediaMessage;
