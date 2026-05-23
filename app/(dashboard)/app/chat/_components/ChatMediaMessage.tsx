"use client";

import { useAuth } from "@/app/context/AuthContext";
import { getMessageLayout, renderCheck } from "@/app/_utils/formatters";
import { LuClock } from "react-icons/lu";
import SafeImage from "@/app/_components/SafeImage";
import { getFileIcon, getRadius } from "@/app/_utils/utility";
import { Download, RefreshCw, AlertCircle } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import SwipeableMessage from "./SwipeableMessage";

const ChatMediaMessage = ({
  msg,
  onOpen,
  mediaImages = [],
  onReply,
  onRetry,
}: any) => {
  const { authDetails } = useAuth();
  const [isFailed, setIsFailed] = useState(false);

  const isSender = msg.sender_id === authDetails?.user?.id;
  const styles = getMessageLayout(isSender);
  const caption = msg.body || msg.caption || "";

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSender && msg.pending) {
      setIsFailed(false);
      timer = setTimeout(() => {
        setIsFailed(true);
      }, 60000);
    } else {
      setIsFailed(false);
    }
    return () => clearTimeout(timer);
  }, [isSender, msg.pending]);

  const isUploading = isSender && msg.pending && !isFailed;

  const mediaUrls = useMemo(() => {
    const raw = msg.media_urls || [];

    return raw;
  }, [msg.media_urls]);

  const renderStatus = () => {
    if (!isSender) return null;
    if (isFailed) return <AlertCircle size={12} className="text-red-500" />;
    if (msg.pending) return <LuClock size={10} />;
    if (msg.read_at) return renderCheck("read");
    return renderCheck("sent");
  };

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
            console.log("images");

            if (!isUploading)
              onOpen?.(
                mediaImages.findIndex((m: any) => m.src === mediaUrls[0]),
              );
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
        {mediaUrls?.slice(0, 4)?.map((img: string, i: number) => (
          <div
            key={i}
            className={`relative overflow-hidden cursor-pointer ${getRadius(i, mediaUrls.length)} ${mediaUrls.length === 3 && i === 2 ? "col-span-2" : ""}`}
            onClick={() =>
              !isUploading &&
              onOpen?.(mediaImages.findIndex((m: any) => m.src === img))
            }
          >
            <SafeImage
              src={img}
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
          className={`flex items-center gap-3 p-3 bg-white/40 border-b border-black/5 ${isUploading ? "cursor-default" : "hover:bg-white/60 cursor-pointer"}`}
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
                : `${msg.file_size || "File"} • ${msg.file_name?.split(".").pop()?.toUpperCase()}`}
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

  return (
    <SwipeableMessage
      isSender={isSender}
      onReply={() => onReply?.(msg)}
      className={styles.container}
    >
      <div
        className={`${styles.bubble} p-0.5 relative w-71.25 rounded-[10px] overflow-hidden shadow-sm`}
      >
        {msg.media_type === "image"
          ? renderImageGrid()
          : msg.media_type === "video"
            ? renderVideo()
            : renderFile()}
        {caption && <div className="px-2.5 py-2 text-[13px]">{caption}</div>}
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
