"use client";

import { useAuth } from "@/app/context/AuthContext";
import { getMessageLayout, renderCheck } from "@/app/_utils/formatters";
import { LuClock, LuDownload } from "react-icons/lu";
import SafeImage from "@/app/_components/SafeImage";
import { getFileIcon } from "@/app/_utils/utility";
import { Download } from "lucide-react";

const ChatMediaMessage = ({ msg, onOpen }: any) => {
  const { authDetails } = useAuth();
  const isSender = msg.sender_id === authDetails?.user?.id;
  const styles = getMessageLayout(isSender);

  const mediaUrl = msg.media_url || msg.local_url;
  const caption = msg.body || msg.caption || "";

  const isUploading = isSender && msg.pending;

  const renderStatus = () => {
    if (!isSender) return null;
    if (msg.pending) return <LuClock size={10} />;
    if (msg.read_at) return renderCheck("read");
    return renderCheck("sent");
  };

  const renderMedia = () => {
    switch (msg.media_type) {
      case "image":
        return (
          <div
            className="relative cursor-pointer"
            onClick={() => !isUploading && onOpen?.(msg.id)}
          >
            <SafeImage
              src={mediaUrl}
              alt="image"
              width={800}
              height={800}
              className="w-full h-88 object-cover rounded-[10px]"
              showLoader
            />

            {isUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-[10px]">
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
            )}
          </div>
        );

      case "video":
        return (
          <div className="relative rounded-[10px] overflow-hidden">
            <video
              src={mediaUrl}
              className="w-full h-88 object-cover"
              controls={!isUploading}
            />

            {isUploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div
                  className="w-8 h-8 rounded-full animate-spin"
                  style={{
                    border: "2px solid #d1fae5",
                    borderTop: "2px solid #059669",
                  }}
                />
              </div>
            )}
          </div>
        );

      case "file":
        const FileIconComponent = getFileIcon(msg.file_name || "");

        return (
          <div className="relative">
            <a
              href={!isUploading ? mediaUrl : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 p-3 bg-white/40 transition-colors border-b border-black/5 
          ${isUploading ? "cursor-default" : "hover:bg-white/60 cursor-pointer"}`}
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

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div
        className={`${styles.bubble} p-0.5 relative w-71.25 rounded-[10px] overflow-hidden shadow-sm`}
      >
        {/* MEDIA */}
        {renderMedia()}

        {/* CAPTION */}
        {caption && <div className="px-2.5 py-2 text-[13px]">{caption}</div>}
        {/* ONLY show overlay if no caption */}
        {!caption && (
          <div
            className={`absolute bottom-0 left-0 right-0 h-20 pointer-events-none ${
              isSender
                ? "bg-linear-to-b from-black/80 via-black/40 to-gray-700"
                : "bg-linear-to-b from-white/80 via-white/10 to-gray-300"
            }`}
          />
        )}

        {/* TIME */}
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
    </div>
  );
};

export default ChatMediaMessage;
