"use client";

import { Image as ImageIcon, Video, FileText, Type } from "lucide-react";
import SafeImage from "@/app/_components/SafeImage";

interface Props {
  reply: any;
  isSender?: boolean;
}

export default function SmartReplyPreview({ reply, isSender }: Props) {
  if (!reply) return null;

  const isImage = reply.media_type === "image";
  const isVideo = reply.media_type === "video";
  const isFile = reply.media_type === "file";

  return (
    <div className="relative text-xs">
      <div className="flex items-center gap-2.5">
        {/* MEDIA PREVIEW THUMBNAIL */}
        {(isImage || isVideo || isFile) && (
          <div className="w-8 h-8 shrink-0 rounded bg-black/10 flex items-center justify-center">
            {isImage && <ImageIcon size={14} className="text-slate-499" />}
            {isVideo && <Video size={14} className="text-slate-499" />}
            {isFile && <FileText size={14} className="text-slate-499" />}
          </div>
        )}

        {/* CONTENT */}
        <div className="flex-1 min-w-0">
          <p className="line-clamp-1 text-gray-400 font-medium">
            {isImage
              ? "Photo"
              : isVideo
                ? "Video"
                : isFile
                  ? reply.file_name || "Document"
                  : reply.body}
          </p>
        </div>
      </div>
    </div>
  );
}
