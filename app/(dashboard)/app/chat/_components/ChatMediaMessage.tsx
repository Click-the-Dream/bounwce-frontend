"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  RefreshCw,
  AlertCircle,
  AtSign,
  Check,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { LuClock } from "react-icons/lu";

import { useAuth } from "@/app/context/AuthContext";
import { getMessageLayout, renderCheck } from "@/app/_utils/formatters";
import { getFileIcon, getRadius } from "@/app/_utils/utility";
import SafeImage from "@/app/_components/SafeImage";
import SwipeableMessage from "./SwipeableMessage";
import { useMessageManagementWindow } from "./use-message-management-window";
import ReplyPreview from "./ReplyPreview";

interface ChatMediaMessageProps {
  msg: any;
  mentionUsers?: Array<{ id: string; username: string; fullName: string }>;
  onOpen?: (url: string) => void;
  onReply?: (msg: any) => void;
  onRetry?: (msg: any) => void;
  onScrollToMessage?: (messageId: string) => void;
  senderName?: string;
  senderAvatar?: string | null;
  onEdit?: (msg: any, body: string) => boolean | void;
  onDelete?: (msg: any) => boolean | void;
}

const ChatMediaMessage = ({
  msg,
  mentionUsers,
  onOpen,
  onReply,
  onRetry,
  onScrollToMessage,
  senderName,
  senderAvatar,
  onEdit,
  onDelete,
}: ChatMediaMessageProps) => {
  const { authDetails } = useAuth();
  const isSender =
    String(msg?.sender_id ?? "") === String(authDetails?.user?.id ?? "");
  const styles = getMessageLayout(isSender);
  const caption = msg.body || msg.caption || "";

  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(String(caption));

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

  const isUploading = msg.delivery_status === "uploading";
  const isSending = msg.delivery_status === "sending";
  const isFailed = msg.delivery_status === "failed";
  const isSent = msg.delivery_status === "sent" || !msg.read_at;
  const isRead = !!msg.read_at;
  const mediaUrls = useMemo(() => msg.media_urls || [], [msg.media_urls]);
  const canManageEligible = Boolean(
    isSender &&
    (onEdit || onDelete) &&
    !msg.pending &&
    msg.delivery_status !== "sending" &&
    msg.delivery_status !== "uploading" &&
    msg.delivery_status !== "failed" &&
    !String(msg.id ?? "").startsWith("optimistic:"),
  );
  const canManageMessage = useMessageManagementWindow(msg, canManageEligible);

  useEffect(() => {
    if (!canManageMessage && isEditing) setIsEditing(false);
  }, [canManageMessage, isEditing]);
  const saveEdit = () => {
    if (!onEdit || !editDraft.trim()) return;
    const accepted = onEdit(msg, editDraft.trim());
    if (accepted !== false) setIsEditing(false);
  };

  const renderStatus = () => {
    if (!isSender) return null;

    if (isUploading) return <LuClock size={10} className="animate-pulse" />;

    if (isFailed) return <AlertCircle size={12} />;

    if (isSending) return <LuClock size={10} />;

    if (isRead) return renderCheck("read");

    if (isSent) return renderCheck("sent");
    return <LuClock size={10} className="animate-pulse" />;
  };

  // ─── UPLOAD OVERLAY ─────────────────────────

  const renderUploadOverlay = () => {
    const base =
      "absolute inset-0 flex items-center justify-center rounded-[10px] z-10 bg-black/40";

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

    if (isUploading || isSending) {
      return (
        <div className={base}>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full animate-spin border-2 border-emerald-100 border-t-emerald-600" />
            <span className="text-white text-[10px]">
              {isUploading ? "Uploading..." : "Sending..."}
            </span>
          </div>
        </div>
      );
    }

    return null;
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
            className="w-full h-80 object-cover rounded-[10px]"
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

  const getFileNameFromUrl = (url: string): string => {
    try {
      const path = new URL(url).pathname;
      const parts = path.split("/");
      const filename = parts[parts.length - 1];
      return filename || "File";
    } catch {
      return "File";
    }
  };

  const getFileExtension = (url: string): string => {
    const filename = getFileNameFromUrl(url);
    const ext = filename.split(".").pop()?.toUpperCase() || "";
    return ext;
  };

  const renderFile = () => {
    // Single file
    if (mediaUrls.length === 1) {
      const FileIconComponent = getFileIcon(mediaUrls[0]);
      const fileName = getFileNameFromUrl(mediaUrls[0]);
      const fileExt = getFileExtension(mediaUrls[0]);

      return (
        <div className="relative">
          <a
            href={!isUploading ? mediaUrls[0] : "#"}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => isUploading && e.preventDefault()}
            className={`flex items-center gap-3 p-3 bg-white/40 border border-black/5 rounded-[10px] ${
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
                {fileName}
              </p>
              <p className="text-[11px] text-gray-500 uppercase">
                {isUploading ? "Sending..." : `${fileExt || "File"}`}
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
        </div>
      );
    }

    // Multiple files — render as list
    return (
      <div className="relative">
        <div className="space-y-1 p-1">
          {mediaUrls.map((url: string, index: number) => {
            const FileIconComponent = getFileIcon(url);
            const fileName = getFileNameFromUrl(url);
            const fileExt = getFileExtension(url);

            return (
              <a
                key={index}
                href={!isUploading ? url : "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => isUploading && e.preventDefault()}
                className={`flex items-center gap-2 p-2 bg-white/40 border border-black/5 rounded-lg ${
                  isUploading
                    ? "cursor-default"
                    : "hover:bg-white/60 cursor-pointer"
                }`}
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                  <FileIconComponent size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-900 truncate">
                    {fileName}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase">
                    {isUploading ? "Sending..." : fileExt}
                  </p>
                </div>
                <div className="text-gray-400">
                  {isUploading ? (
                    <div className="w-3 h-3 rounded-full animate-spin border border-emerald-100 border-t-emerald-600" />
                  ) : (
                    <Download size={14} />
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <SwipeableMessage
      isSender={isSender}
      onReply={() => onReply?.(msg)}
      className={styles.container}
      animateIn={Boolean(
        msg.pending ||
        msg.delivery_status === "sending" ||
        msg.delivery_status === "uploading",
      )}
    >
      <div
        data-message-id={msg.id}
        className={`
          ${styles.bubble}
          p-0.5 relative w-full rounded-[10px] overflow-hidden shadow-sm
          transition-colors duration-300
          ${isHighlighted ? "ring-2 ring-orange/60" : ""}
        `}
      >
        {senderName && !isSender && (
          <div className="flex items-center gap-1.5 px-2.5 pt-2">
            {senderAvatar && (
              <img
                src={senderAvatar}
                alt=""
                className="size-4 shrink-0 rounded-full object-cover"
              />
            )}
            <p className="text-[11px] font-semibold text-orange">
              {senderName}
            </p>
          </div>
        )}

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

        {!isSender &&
          Array.isArray(msg?.mentioned_user_ids) &&
          msg.mentioned_user_ids.some(
            (id: unknown) => String(id) === String(authDetails?.user?.id ?? ""),
          ) && (
            <span className="mx-2.5 mt-2 inline-flex items-center gap-1 rounded-full bg-orange/10 px-2 py-0.5 text-[10px] font-semibold text-orange">
              <AtSign size={11} /> Mentioned you
            </span>
          )}

        {/* Caption / inline caption edit */}
        {isEditing ? (
          <div className="space-y-2 px-2.5 py-2">
            <textarea
              autoFocus
              rows={2}
              maxLength={4000}
              value={editDraft}
              onChange={(event) => setEditDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setIsEditing(false);
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  saveEdit();
                }
              }}
              className="w-full resize-y rounded-lg border border-black/10 bg-white px-2 py-1.5 text-[13px] text-gray-900 outline-none focus:border-orange"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-500 hover:bg-gray-100"
              >
                <X size={12} /> Cancel
              </button>
              <button
                type="button"
                disabled={!editDraft.trim()}
                onClick={saveEdit}
                className="inline-flex items-center gap-1 rounded-md bg-orange px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-50"
              >
                <Check size={12} /> Save
              </button>
            </div>
          </div>
        ) : caption ? (
          <div className="px-2.5 py-2 text-[13px] whitespace-pre-wrap wrap-break-word">
            {String(caption)
              .split(/(@[A-Za-z0-9_.-]+)/g)
              .map((token, index) => {
                if (!token.startsWith("@"))
                  return <span key={`caption-text-${index}`}>{token}</span>;
                const person = mentionUsers?.find(
                  (member) =>
                    `@${member.username}`.toLowerCase() === token.toLowerCase(),
                );
                if (!person)
                  return <span key={`caption-text-${index}`}>{token}</span>;
                const slug = person.fullName
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "");
                return (
                  <a
                    key={`caption-mention-${index}`}
                    href={`/app/profile/${slug}_${person.id}`}
                    title={`View ${person.fullName}'s profile`}
                    className="mx-0.5 inline-flex items-center rounded-md bg-sky-500/15 px-1.5 py-0.5 align-baseline font-semibold text-sky-700 transition-colors hover:bg-sky-500/25 hover:underline"
                  >
                    {token}
                  </a>
                );
              })}
          </div>
        ) : null}

        {/* ONLY show overlay if no caption */}
        {!caption && !isEditing && (
          <div
            className={`absolute bottom-0 left-0 right-0 h-20 pointer-events-none ${
              isSender
                ? "bg-linear-to-t from-black/80 via-black/40 to-transparent"
                : "bg-linear-to-b from-white/80 via-white/10 to-gray-300"
            }`}
          />
        )}
        {/* Time + status */}
        <span
          className={`absolute bottom-1 right-2 text-[10px] flex items-center gap-1 ${styles.time} drop-shadow-md`}
        >
          {msg?.is_edited && <span className="text-[9px]">edited · </span>}
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
      {canManageMessage && !isEditing && (
        <div className="mt-1 grid w-full grid-rows-[1fr] opacity-100 sm:mt-0 sm:grid-rows-[0fr] sm:opacity-0 sm:transition-[grid-template-rows,opacity,margin] sm:duration-200 sm:ease-out sm:group-hover:mt-1 sm:group-hover:grid-rows-[1fr] sm:group-hover:opacity-100 sm:group-focus-within:mt-1 sm:group-focus-within:grid-rows-[1fr] sm:group-focus-within:opacity-100 motion-reduce:transition-none">
          <div className="min-h-0 overflow-hidden">
            <div className="flex justify-end gap-1.5 border-t border-current/10 pt-1">
              {onEdit && caption && (
                <button
                  type="button"
                  onClick={() => {
                    setEditDraft(String(caption));
                    setIsEditing(true);
                  }}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:min-h-9 sm:min-w-0 sm:px-2 sm:py-1 sm:text-[11px]"
                >
                  <Pencil size={14} /> Edit caption
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(msg)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs text-red-600/80 transition hover:bg-red-500/10 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:min-h-9 sm:min-w-0 sm:px-2 sm:py-1 sm:text-[11px]"
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </SwipeableMessage>
  );
};

export default ChatMediaMessage;
