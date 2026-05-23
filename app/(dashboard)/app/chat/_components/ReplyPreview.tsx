"use client";

import SafeImage from "@/app/_components/SafeImage";
import { getFileIcon } from "@/app/_utils/utility";
import { useAuth } from "@/app/context/AuthContext";
import { Video, Image as ImageIcon, File } from "lucide-react";

interface Props {
  reply: any;
  isSender?: boolean;
}

export default function ReplyPreview({ reply, isSender }: Props) {
  const { authDetails } = useAuth();

  if (!reply) return null;

  const isReplySender = reply.sender_id === authDetails?.user?.id;

  const mediaType = reply.media_type;

  const getIcon = () => {
    if (mediaType === "image") return ImageIcon;
    if (mediaType === "video") return Video;
    if (mediaType === "file") return File;

    return null;
  };

  const Icon = getIcon();

  const getPreviewText = () => {
    if (reply.body) return reply.body;

    if (mediaType === "image") return "Photo";
    if (mediaType === "video") return "Video";
    if (mediaType === "file") return reply.file_name || "File";

    return "Message";
  };

  const renderThumbnail = () => {
    if (mediaType === "image" && reply.media_url?.[0]) {
      return (
        <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 bg-black/5">
          <SafeImage
            src={reply.media_url[0]}
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
        <div className="w-9 h-9 rounded-md bg-black/50 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-black/40" />
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={`
        mb-1 px-2.5 py-2 rounded-md w-full
        border-l-[2.5px]
        flex items-center gap-2
        ${
          isSender
            ? "border-green-500 bg-black/40"
            : "border-gray-300 bg-black/60"
        }
      `}
    >
      {/* THUMBNAIL */}
      {renderThumbnail()}

      {/* CONTENT */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {/* NAME */}
        <div
          className={`
            text-[10px] font-medium truncate
            ${isSender ? "text-green-700/80" : "text-gray-500"}
          `}
        >
          {isReplySender ? "You" : reply.sender?.full_name || "User"}
        </div>

        {/* MESSAGE */}
        <div className="flex items-center gap-1 text-[12px] text-black/55 truncate">
          {Icon && <Icon size={12} className="shrink-0 text-black/35" />}

          <span className="truncate">{getPreviewText()}</span>
        </div>
      </div>
    </div>
  );
}
