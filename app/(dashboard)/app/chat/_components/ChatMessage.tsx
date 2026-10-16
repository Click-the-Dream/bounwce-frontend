"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getMessageLayout, renderCheck } from "@/app/_utils/formatters";
import { useAuth } from "@/app/context/AuthContext";
import { LuClock } from "react-icons/lu";
import SwipeableMessage from "./SwipeableMessage";
import { useMessageManagementWindow } from "./use-message-management-window";
import ReplyPreview from "./ReplyPreview";
import { AlertCircle, AtSign, Check, Pencil, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";
import MessageLinkPreview from "./MessageLinkPreview";
import { getMessageUrlSegments, resolveMessageUrl } from "./message-links";
import UserImage from "../../_components/UserImage";

interface ChatMessageProps {
  msg: any;
  mentionUsers?: Array<{ id: string; username: string; fullName: string }>;
  onReply?: (msg: any) => void;
  onScrollToMessage?: (messageId: string) => void;
  senderName?: string;
  senderAvatar?: string | null;
  onEdit?: (msg: any, body: string) => boolean | void;
  onDelete?: (msg: any) => boolean | void;
}

const isSingleEmoji = (text: string) => {
  const value = text?.trim();
  if (!value) return false;

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, {
      granularity: "grapheme",
    });

    const segments = [...segmenter.segment(value)];

    if (segments.length !== 1) return false;

    return /\p{Extended_Pictographic}/u.test(segments[0].segment);
  }

  return /^\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier}|\u200D\p{Extended_Pictographic})*$/u.test(
    value,
  );
};

// Render text and URLs while keeping internal links inside the app.
const renderMessageBody = (text: string, isSender: boolean, mentionUsers: ChatMessageProps["mentionUsers"] = []) => {
  // Render recognized @mentions as profile links with a distinct WhatsApp-style pill.
  const renderTextWithMentions = (value: string, keyPrefix: string) => {
    if (!mentionUsers?.length) return value;
    const tokens = value.split(/(@[A-Za-z0-9_.-]+)/g);
    return tokens.map((token, tokenIndex) => {
      if (!token.startsWith("@")) return token;
      const person = mentionUsers.find(
        (member) => `@${member.username}`.toLowerCase() === token.toLowerCase(),
      );
      if (!person) return token;
      const slug = person.fullName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const href = `/app/profile/${slug}_${person.id}`;
      return (
        <Link
          key={`${keyPrefix}-mention-${tokenIndex}`}
          href={href}
          title={`View ${person.fullName}'s profile`}
          onClick={(event) => event.stopPropagation()}
          className="mx-0.5 inline-flex items-center rounded-md bg-sky-500/15 px-1.5 py-0.5 align-baseline font-semibold text-sky-700 decoration-sky-500/40 underline-offset-2 transition-colors hover:bg-sky-500/25 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          {token}
        </Link>
      );
    });
  };
  const parts = getMessageUrlSegments(text);

  return parts.map((part, index) => {
    if (part.type === "text") {
      return <span key={`text-${index}`}>{renderTextWithMentions(part.value, `text-${index}`)}</span>;
    }

    const info = resolveMessageUrl(part.value);

    if (!info) {
      return (
        <span key={`plain-url-${index}`}>
          {part.value}
          {part.trailing}
        </span>
      );
    }

    const className = `underline underline-offset-2 transition-opacity hover:opacity-70 ${
      isSender ? "text-slate-900" : "text-green-700"
    }`;

    const link = info.isInternal ? (
      <Link
        href={info.navigationHref}
        onClick={(event) => event.stopPropagation()}
        className={className}
      >
        {part.value}
      </Link>
    ) : (
      <a
        href={info.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
        className={className}
      >
        {part.value}
      </a>
    );

    return (
      <Fragment key={`url-${index}`}>
        {link}
        {part.trailing}
      </Fragment>
    );
  });
};

const ChatMessage = ({
  msg,
  mentionUsers,
  onReply,
  onScrollToMessage,
  senderName,
  senderAvatar,
  onEdit,
  onDelete,
}: ChatMessageProps) => {
  const { authDetails } = useAuth();

  const isSender =
    String(msg?.sender_id ?? "") === String(authDetails?.user?.id ?? "");

  const styles = getMessageLayout(isSender);

  const [expanded, setExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(String(msg?.body ?? ""));

  const textRef = useRef<HTMLDivElement>(null);

  const isEmojiOnly = isSingleEmoji(msg?.body ?? "");

  // Detect overflow to decide whether to show "Read more".
  useEffect(() => {
    const element = textRef.current;

    if (element && !isEmojiOnly) {
      setShowReadMore(element.scrollHeight > element.clientHeight + 5);
    } else {
      setShowReadMore(false);
    }
  }, [msg?.body, isEmojiOnly]);

  const isUploading = msg.delivery_status === "uploading";

  const isSending = msg.delivery_status === "sending" || msg.pending;
  const isFailed = msg.delivery_status === "failed";
  const isSent = msg.delivery_status === "sent" || !msg.read_at;
  const isDelivered = msg.delivery_status === "delivered";
  const isRead = Boolean(msg.read_at);

  const renderStatus = () => {
    if (!isSender) return null;

    if (isUploading) {
      return <LuClock size={10} className="animate-pulse" />;
    }

    if (isFailed) {
      return <AlertCircle size={12} className="text-red-500" />;
    }

    if (isSending) {
      return <LuClock size={10} />;
    }

    if (isDelivered) {
      return renderCheck("delivered");
    }

    if (isRead) {
      return renderCheck("read", styles.time);
    }

    if (isSent) {
      return renderCheck("sent");
    }

    return <LuClock size={10} />;
  };

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
    const body = editDraft.trim();

    if (!body || !onEdit) return;

    const accepted = onEdit(msg, body);

    if (accepted !== false) {
      setIsEditing(false);
    }
  };

  // Highlight this message when another message links to it.
  useEffect(() => {
    let highlightTimeout: ReturnType<typeof setTimeout> | undefined;

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ messageId?: string }>;

      if (customEvent.detail?.messageId !== msg.id) {
        return;
      }

      setIsHighlighted(true);

      if (highlightTimeout) {
        clearTimeout(highlightTimeout);
      }

      highlightTimeout = setTimeout(() => setIsHighlighted(false), 1500);
    };

    window.addEventListener("highlight-message", handler);

    return () => {
      window.removeEventListener("highlight-message", handler);

      if (highlightTimeout) {
        clearTimeout(highlightTimeout);
      }
    };
  }, [msg.id]);

  return (
    <SwipeableMessage
      isSender={isSender}
      onReply={() => onReply?.(msg)}
      className={styles.container}
      animateIn={Boolean(msg.pending || msg.delivery_status === "sending")}
    >
      <div
        // Used by MessageList to find and scroll to this message.
        data-message-id={msg.id}
        className={`
          ${styles.bubble}
          group relative rounded-[10px] text-[13px]
          transition-colors duration-300
          ${isHighlighted ? "ring-2 ring-orange/60 bg-orange/10" : ""}
        `}
        style={{
          boxShadow: "0px 0px 1.5px 0px #00000040",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          whiteSpace: "pre-wrap",
          padding: msg?.reply_to ? "6px" : "10px",
          borderTopLeftRadius: msg.reply_to && !isSender ? "0" : undefined,
          borderTopRightRadius: msg.reply_to && isSender ? "0" : undefined,
        }}
      >
        {/* Reply preview */}
        {msg.reply_to_message && (
          <ReplyPreview
            reply={msg.reply_to_message}
            isSender={isSender}
            onScrollToMessage={onScrollToMessage}
          />
        )}

        {/* Sender information */}
        {senderName && !isSender && (
          <div className="mb-1 flex items-center gap-1.5">
            {senderAvatar && (
              <UserImage
                user={{
                  id: msg.sender_id,
                  full_name: senderName,
                  profile_pic: { url: senderAvatar },
                }}
                size={18}
                rounded="rounded-full"
              />
            )}

            <p className="text-[11px] font-semibold text-orange line-clamp-1">
              {senderName}
            </p>
          </div>
        )}

        {!isSender &&
          Array.isArray(msg?.mentioned_user_ids) &&
          msg.mentioned_user_ids.some(
            (id: unknown) => String(id) === String(authDetails?.user?.id ?? ""),
          ) && (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-orange/10 px-2 py-0.5 text-[10px] font-semibold text-orange">
              <AtSign size={11} /> Mentioned you
            </span>
          )}

        {/* Message body / inline edit */}
        {isEditing ? (
          <div className="min-w-0 space-y-2 sm:min-w-47.5">
            <textarea
              autoFocus
              rows={Math.min(5, Math.max(2, editDraft.split("\n").length))}
              maxLength={4000}
              value={editDraft}
              onChange={(event) => setEditDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setIsEditing(false);
                }

                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  saveEdit();
                }
              }}
              className="
                w-full resize-y rounded-lg
                border border-black/10
                bg-white/90 px-2 py-1.5
                text-[13px] text-gray-900
                outline-none focus:border-orange
              "
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="
                  inline-flex min-h-10 items-center gap-1
                  rounded-md px-3 py-2 text-xs
                  text-current/70 transition-colors
                  hover:bg-black/5
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-orange
                "
              >
                <X size={14} />
                Cancel
              </button>

              <button
                type="button"
                disabled={!editDraft.trim()}
                onClick={saveEdit}
                className="
                  inline-flex min-h-10 items-center gap-1
                  rounded-md bg-white/90 px-3 py-2
                  text-xs font-semibold text-orange
                  transition-colors hover:bg-white
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-orange
                "
              >
                <Check size={14} />
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={textRef}
            className={`pr-2 ${
              !expanded && !isEmojiOnly ? "line-clamp-4" : ""
            }`}
          >
            {isEmojiOnly ? (
              <motion.span
                className="
                  inline-block origin-center
                  text-[50px] leading-none
                "
                initial={{
                  opacity: 0,
                  scale: 0.5,
                }}
                whileInView={{
                  opacity: 1,
                  scale: 1,
                }}
                viewport={{
                  once: true,
                  amount: 0.8,
                }}
                transition={{
                  duration: 0.45,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              >
                {String(msg.body ?? "").trim()}
              </motion.span>
            ) : (
              renderMessageBody(msg?.body ?? "", isSender, mentionUsers)
            )}
          </div>
        )}

        {/* Link preview */}
        {!isEditing && !isEmojiOnly && msg?.body && (
          <MessageLinkPreview text={msg.body} isSender={isSender} />
        )}

        {/* Read more / less */}
        {!isEditing && showReadMore && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={`mt-1 block text-[11px] font-semibold opacity-60 transition-opacity hover:opacity-100 active:scale-95
              ${isSender ? "text-black" : "text-green-800"}
            `}
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        )}

        {/* Timestamp and delivery status */}
        <div className="mt-0.5 flex justify-end">
          <div
            className={`
              flex items-center gap-1
              text-[10px] opacity-70 ${styles.time}
            `}
          >
            {msg?.is_edited && <span className="text-[9px]">edited ·</span>}

            {msg?.created_at &&
              new Date(msg.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}

            {isSender && <span className="text-[10px]">{renderStatus()}</span>}
          </div>
        </div>

        {/* Responsive Edit / Delete actions */}
        {canManageMessage && !isEditing && (
          <div className="mt-1 grid grid-rows-[1fr] opacity-100 sm:mt-0 sm:grid-rows-[0fr] sm:opacity-0 sm:transition-[grid-template-rows,opacity,margin] sm:duration-200 sm:ease-out sm:group-hover:mt-1 sm:group-hover:grid-rows-[1fr] sm:group-hover:opacity-100 sm:group-focus-within:mt-1 sm:group-focus-within:grid-rows-[1fr] sm:group-focus-within:opacity-100 motion-reduce:transition-none">
            <div className="min-h-0 overflow-hidden">
              <div
                className="
                  flex justify-end gap-1.5
                  border-t border-current/10 pt-1
                "
              >
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditDraft(String(msg?.body ?? ""));
                      setIsEditing(true);
                    }}
                    aria-label="Edit message"
                    className=" inline-flex min-h-5 min-w-8 items-center justify-center gap-1.5 rounded-md p-2 text-xs font-medium text-current/75 transition-colors duration-150 hover:bg-black/5 hover:text-current active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:min-h-9 sm:min-w-0 sm:px-2 sm:py-1 sm:text-[11px]"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                )}

                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(msg)}
                    aria-label="Delete message"
                    className="inline-flex min-h-5 min-w-8 items-center justify-center gap-1 rounded-md p-2 text-xs font-medium text-current/75 transition-colors duration-150 hover:bg-red-500/10 hover:text-red-600 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:min-h-9 sm:min-w-0 sm:px-2 sm:py-1 sm:text-[11px]"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </SwipeableMessage>
  );
};

export default ChatMessage;
