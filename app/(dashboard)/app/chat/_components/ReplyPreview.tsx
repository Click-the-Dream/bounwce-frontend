"use client";

import SafeImage from "@/app/_components/SafeImage";
import { getFileIcon } from "@/app/_utils/utility";
import { useAuth } from "@/app/context/AuthContext";
import { Video } from "lucide-react";

interface Props {
  reply: any;
  isSender?: boolean;
}

export default function ReplyPreview({ reply, isSender }: Props) {
  const { authDetails } = useAuth();
  if (!reply) return null;

  const isReplySender = reply.sender_id === authDetails?.user?.id;
  const mediaType = reply.media_type;

  const renderMedia = () => {
    if (mediaType === "image") {
      return (
        <div className="w-7 h-7 shrink-0 overflow-hidden rounded-md bg-black/5">
          <SafeImage
            src={reply.media_url?.[0]}
            alt="reply"
            width={28}
            height={28}
            className="w-full h-full object-cover opacity-80 grayscale-[20%]"
          />
        </div>
      );
    }

    if (mediaType === "video") {
      return (
        <div className="w-7 h-7 shrink-0 rounded-md bg-black/5 flex items-center justify-center">
          <Video size={14} className="opacity-60" />
        </div>
      );
    }

    if (mediaType === "file") {
      const FileIcon = getFileIcon(reply.file_name || "");
      return (
        <div className="w-7 h-7 shrink-0 rounded-md bg-black/5 flex items-center justify-center">
          <FileIcon size={14} className="opacity-60" />
        </div>
      );
    }

    return null;
  };

  const getPreviewText = () => {
    if (reply.body) return reply.body;

    if (mediaType === "image") return "Photo";
    if (mediaType === "video") return "Video";
    if (mediaType === "file") return reply.file_name || "File";

    return "Message";
  };

  return (
    <div
      className={`
        mb-1 px-2.5 py-1.5 rounded-md text-xs w-full
        border-l-2
        ${isSender ? "border-green-500 bg-black/5" : "border-gray-300 bg-black/[0.03]"}
      `}
    >
      <div className="flex items-center gap-2 min-w-0">
        {/* MEDIA THUMB */}
        {mediaType && renderMedia()}

        {/* TEXT */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
            {isReplySender ? "You" : reply.sender?.full_name || "User"}
          </div>

          <div className="text-[12px] font-medium text-gray-800 truncate">
            {getPreviewText()}
          </div>
        </div>
      </div>
    </div>
  );
}
