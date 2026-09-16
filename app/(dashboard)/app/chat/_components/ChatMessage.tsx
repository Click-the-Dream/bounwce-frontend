"use client";

import { useEffect, useRef, useState } from "react";
import { getMessageLayout, renderCheck } from "@/app/_utils/formatters";
import { useAuth } from "@/app/context/AuthContext";
import { LuClock } from "react-icons/lu";
import SwipeableMessage from "./SwipeableMessage";
import ReplyPreview from "./ReplyPreview";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ChatMessageProps {
  msg: any;
  onReply?: (msg: any) => void;
  onScrollToMessage?: (messageId: string) => void;
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

// ─── URL RENDERING
const urlRegex = /((?:https?:\/\/|www\.)[^\s<]+)/gi;

const renderMessageBody = (text: string, isSender: boolean) => {
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    const isUrl = /^(?:https?:\/\/|www\.)/i.test(part);

    if (!isUrl) {
      return <span key={index}>{part}</span>;
    }

    const href = /^https?:\/\//i.test(part) ? part : `https://${part}`;

    return (
      <a
        key={index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`underline underline-offset-2 transition-opacity hover:opacity-70 ${
          isSender ? "text-slate-900" : "text-green-800"
        }`}
      >
        {part}
      </a>
    );
  });
};
// COMPONENT

const ChatMessage = ({ msg, onReply, onScrollToMessage }: ChatMessageProps) => {
  const { authDetails } = useAuth();
  const isSender = msg.sender_id === authDetails?.user?.id;
  const styles = getMessageLayout(isSender);
  const [expanded, setExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  const isEmojiOnly = isSingleEmoji(msg?.body);

  // Detect overflow to decide whether to show "Read more"
  useEffect(() => {
    const el = textRef.current;

    if (el && !isEmojiOnly) {
      setShowReadMore(el.scrollHeight > el.clientHeight + 5);
    } else {
      setShowReadMore(false);
    }
  }, [msg?.body, isEmojiOnly]);

  const isUploading = msg.delivery_status === "uploading";

  const isSending = msg.delivery_status === "sending" || msg.pending;

  const isFailed = msg.delivery_status === "failed";

  const isSent = msg.delivery_status === "sent" || !msg.read_at;

  const isDelivered = msg.delivery_status === "delivered";

  const isRead = !!msg.read_at;

  // ─── STATUS

  const renderStatus = () => {
    if (!isSender) return null;
    if (isUploading) return <LuClock size={10} className="animate-pulse" />;
    if (isFailed) return <AlertCircle size={12} className="text-red-500" />;
    if (isSending) return <LuClock size={10} />;
    if (isDelivered) return renderCheck("delivered");
    if (isRead) return renderCheck("read", styles.time);
    if (isSent) return renderCheck("sent");

    return <LuClock size={10} />;
  };

  // Called when this message is scrolled to as a reply target
  const highlight = () => {
    setIsHighlighted(true);
    setTimeout(() => setIsHighlighted(false), 1500);
  };

  useEffect(() => {
    const handler = (e: CustomEvent) => {
      if (e.detail?.messageId === msg.id) {
        highlight();
      }
    };

    window.addEventListener("highlight-message", handler as EventListener);
    return () =>
      window.removeEventListener("highlight-message", handler as EventListener);
  }, [msg.id]);

  return (
    <SwipeableMessage
      isSender={isSender}
      onReply={() => onReply?.(msg)}
      className={styles.container}
    >
      <div
        // Used by MessageList to find and scroll to this element
        data-message-id={msg.client_id || msg.id}
        className={`
          ${styles.bubble}
          relative rounded-[10px] text-[13px]
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
        {/* Reply preview — clicking scrolls to original */}
        {msg.reply_to_message && (
          <ReplyPreview
            reply={msg.reply_to_message}
            isSender={isSender}
            onScrollToMessage={onScrollToMessage}
          />
        )}

        {/* Message body */}
        <div
          ref={textRef}
          className={`pr-2 ${!expanded && !isEmojiOnly ? "line-clamp-4" : ""}`}
        >
          {isEmojiOnly ? (
            <motion.span
              className="inline-block text-[50px] leading-none origin-center"
              initial={{
                opacity: 0,
                scale: 0.5,
              }}
              whileInView={{
                opacity: 1,
                scale: 1,
              }}
              viewport={{
                once: false,
                amount: 0.8,
              }}
              transition={{
                duration: 0.45,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            >
              {msg.body.trim()}
            </motion.span>
          ) : (
            renderMessageBody(msg?.body ?? "", isSender)
          )}
        </div>

        {/* Read more / less toggle */}
        {showReadMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={`block text-[11px] mt-1 font-semibold opacity-60 hover:opacity-100 transition-opacity active:scale-95 ${
              isSender ? "text-black" : "text-green-800"
            }`}
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        )}

        {/* Footer: time + status */}
        <div className="flex justify-end mt-0.5">
          <div
            className={`flex items-center gap-1 text-[10px] opacity-70 ${styles.time}`}
          >
            {msg?.created_at &&
              new Date(msg.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}

            {isSender && <span className="text-[10px]">{renderStatus()}</span>}
          </div>
        </div>
      </div>
    </SwipeableMessage>
  );
};

export default ChatMessage;
