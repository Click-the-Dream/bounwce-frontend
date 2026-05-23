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

  return (
    <div
      className={`
        mb-1 px-2.5 py-1.5 rounded-md text-xs w-full
        border-l-2
        ${isSender ? "border-green-500 bg-black/5" : "border-gray-300 bg-black/[0.03]"}
      `}
    >
      {/* sender */}
      <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {isReplySender ? "You" : reply.sender?.full_name || "User"}
      </div>

      {/* INLINE CONTENT */}
      <div className="flex items-center gap-1 min-w-0">
        {/* ICON */}
        {Icon && <Icon size={12} className="text-gray-400 shrink-0" />}

        {/* TEXT */}
        <span className="text-[12px] text-gray-500 truncate">
          {getPreviewText()}
        </span>
      </div>
    </div>
  );
}
