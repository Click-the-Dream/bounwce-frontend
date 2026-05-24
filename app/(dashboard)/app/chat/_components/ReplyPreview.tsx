"use client";

import SafeImage from "@/app/_components/SafeImage";
import { useAuth } from "@/app/context/AuthContext";
import { Video, Image as ImageIcon, File } from "lucide-react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface ReplyPreviewProps {
  reply: any;
  isSender?: boolean;
  /**
   * When provided, clicking the preview scrolls to and highlights
   * the original message. Pass the scroll container ref from MessageList.
   */
  onScrollToMessage?: (messageId: string) => void;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const getMediaIcon = (mediaType?: string) => {
  if (mediaType === "image") return ImageIcon;
  if (mediaType === "video") return Video;
  if (mediaType === "file") return File;
  return null;
};

const getPreviewText = (reply: any) => {
  if (reply.body) return reply.body;
  if (reply.media_type === "image") return "Photo";
  if (reply.media_type === "video") return "Video";
  if (reply.media_type === "file") return reply.file_name || "File";
  return "Message";
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export default function ReplyPreview({
  reply,
  isSender,
  onScrollToMessage,
}: ReplyPreviewProps) {
  const { authDetails } = useAuth();

  if (!reply) return null;

  const isReplySender = reply.sender_id === authDetails?.user?.id;
  const Icon = getMediaIcon(reply.media_type);
  const previewText = getPreviewText(reply);
  const isClickable = !!onScrollToMessage;

  const handleClick = () => {
    if (onScrollToMessage && reply.id) {
      onScrollToMessage(reply.id);
    }
  };

  const renderThumbnail = () => {
    if (reply.media_type === "image" && reply.media_urls?.[0]) {
      return (
        <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 bg-black/5">
          <SafeImage
            src={reply.media_urls[0]}
            alt="reply"
            width={36}
            height={36}
            className="w-full h-full object-cover opacity-75"
          />
        </div>
      );
    }

    if (Icon) {
      return (
        <div
          className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
            isSender ? "bg-black/10" : "bg-gray-300/50"
          }`}
        >
          <Icon size={16} className="text-black/40" />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      onClick={handleClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable ? (e) => e.key === "Enter" && handleClick() : undefined
      }
      className={`
        mb-1 px-2.5 py-2 rounded-md w-full
        flex items-start gap-2
        min-w-0
        backdrop-blur-sm
        transition-opacity
        ${isSender ? "bg-white/80" : "bg-black/80"}
        ${isClickable ? "cursor-pointer hover:opacity-80 active:opacity-60" : ""}
      `}
      style={{ borderLeft: "4px solid #bbb" }}
    >
      {/* Thumbnail */}
      {renderThumbnail()}

      {/* Text content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {/* Sender name */}
        <div
          className={`text-[10px] font-medium truncate ${
            isSender ? "text-green-700/80" : "text-orange"
          }`}
        >
          {isReplySender ? "You" : reply.sender?.full_name || "User"}
        </div>

        {/* Message preview */}
        <div className="flex items-center gap-1 text-[12px] text-black/55 min-w-0">
          {Icon && (
            <Icon
              size={14}
              className={`shrink-0 ${
                isSender ? "text-black/80" : "text-gray-300"
              }`}
            />
          )}
          <span
            className={`min-w-0 flex-1 line-clamp-2 wrap-break-word leading-tight ${
              isSender ? "text-black/80" : "text-gray-300"
            }`}
          >
            {previewText}
          </span>
        </div>
      </div>
    </div>
  );
}
