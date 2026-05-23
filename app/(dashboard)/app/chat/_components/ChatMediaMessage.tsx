"use client";

import { useAuth } from "@/app/context/AuthContext";
import { getMessageLayout, renderCheck } from "@/app/_utils/formatters";
import { LuClock } from "react-icons/lu";
import SafeImage from "@/app/_components/SafeImage";
import { getFileIcon, getRadius } from "@/app/_utils/utility";
import { Download } from "lucide-react";
import { useMemo } from "react";
import SwipeableMessage from "./SwipeableMessage";

const ChatMediaMessage = ({ msg, onOpen, mediaImages = [], onReply }: any) => {
  const { authDetails } = useAuth();

  const isSender = msg.sender_id === authDetails?.user?.id;

  const styles = getMessageLayout(isSender);

  const caption = msg.body || msg.caption || "";

  const isUploading = isSender && msg.pending;

  const mediaUrls = useMemo(() => {
    const raw = msg.media_url;

    if (!raw) return [];

    if (Array.isArray(raw)) return raw;

    if (typeof raw === "string") return [raw];

    return [];
  }, [msg.media_url]);

  const renderStatus = () => {
    if (!isSender) return null;

    if (msg.pending) return <LuClock size={10} />;

    if (msg.read_at) return renderCheck("read");

    return renderCheck("sent");
  };

  const renderUploadOverlay = () => {
    if (!isUploading) return null;

    return (
      <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[10px] z-10">
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="w-8 h-8 rounded-full animate-spin"
            style={{
              border: "2px solid #d1fae5",
              borderTop: "2px solid #059669",
            }}
          />
          <span className="text-white text-[10px]">Sending...</span>
        </div>
      </div>
    );
  };

  const renderImageGrid = () => {
    const gridClass =
      mediaUrls.length === 1
        ? ""
        : mediaUrls.length === 2
          ? "grid grid-cols-2 gap-0.5"
          : "grid grid-cols-2 gap-0.5 auto-rows-[110px]";

    if (mediaUrls.length === 1) {
      return (
        <div
          className="relative cursor-pointer"
          onClick={() => {
            if (isUploading) return;

            const index = mediaImages.findIndex(
              (m: any) => m.src === mediaUrls[0],
            );

            onOpen?.(index);
          }}
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

    return (
      <div className={`relative ${gridClass} rounded-[10px] overflow-hidden`}>
        {mediaUrls?.slice(0, 4)?.map((img: string, i: number) => {
          const isLast = i === 3;

          const extraCount = mediaUrls.length - 4;

          return (
            <div
              className={`relative overflow-hidden cursor-pointer ${getRadius(
                i,
                mediaUrls.length,
              )} ${mediaUrls.length === 3 && i === 2 ? "col-span-2" : ""}`}
              onClick={() => {
                if (isUploading) return;

                const index = mediaImages.findIndex((m: any) => m.src === img);

                onOpen?.(index);
              }}
            >
              <SafeImage
                src={img}
                alt="chat"
                width={500}
                height={500}
                className="w-full h-44 object-cover"
                showLoader
              />

              {isLast && extraCount > 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">
                    +{extraCount}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {renderUploadOverlay()}
      </div>
    );
  };

  const renderVideo = () => {
    return (
      <div className="relative rounded-[10px] overflow-hidden">
        <video
          src={mediaUrls[0]}
          className="w-full h-88 object-cover"
          controls={!isUploading}
        />

        {renderUploadOverlay()}
      </div>
    );
  };

  const renderFile = () => {
    const FileIconComponent = getFileIcon(msg.file_name || "");

    return (
      <div className="relative">
        <a
          href={!isUploading ? mediaUrls[0] : "#"}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 p-3 bg-white/40 transition-colors border-b border-black/5 
            ${
              isUploading
                ? "cursor-default"
                : "hover:bg-white/60 cursor-pointer"
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
                : `${msg.file_size || "File"} • ${msg.file_name
                    ?.split(".")
                    .pop()
                    ?.toUpperCase()}`}
            </p>
          </div>

          <div className="text-gray-400">
            {isUploading ? (
              <div
                className="w-4 h-4 rounded-full animate-spin"
                style={{
                  border: "2px solid #d1fae5",
                  borderTop: "2px solid #059669",
                }}
              />
            ) : (
              <Download size={16} />
            )}
          </div>
        </a>
      </div>
    );
  };

  const renderMedia = () => {
    switch (msg.media_type) {
      case "image":
        return renderImageGrid();

      case "video":
        return renderVideo();

      case "file":
        return renderFile();

      default:
        return null;
    }
  };

  return (
    <SwipeableMessage
      isSender={isSender}
      onReply={() => onReply?.(msg)}
      className={styles.container}
    >
      <div
        className={`${styles.bubble} p-0.5 relative w-71.25 rounded-[10px] overflow-hidden shadow-sm`}
      >
        {renderMedia()}

        {caption && <div className="px-2.5 py-2 text-[13px]">{caption}</div>}

        {!caption && (
          <div
            className={`absolute bottom-0 left-0 right-0 h-20 pointer-events-none ${
              isSender
                ? "bg-linear-to-b from-black/80 via-black/40 to-gray-700"
                : "bg-linear-to-b from-white/80 via-white/10 to-gray-300"
            }`}
          />
        )}

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
