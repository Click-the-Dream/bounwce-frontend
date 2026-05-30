"use client";

import { useEffect, useRef, useState } from "react";
import { getMessageLayout, renderCheck } from "@/app/_utils/formatters";
import { useAuth } from "@/app/context/AuthContext";
import { LuClock } from "react-icons/lu";
import SwipeableMessage from "./SwipeableMessage";
import ReplyPreview from "./ReplyPreview";
import { AlertCircle } from "lucide-react";

// TYPES

interface ChatMessageProps {
  msg: any;
  onReply?: (msg: any) => void;
  /**
   * Passed down from MessageList so clicking a reply preview
   * scrolls the container to the original message.
   */
  onScrollToMessage?: (messageId: string) => void;
}

// COMPONENT

const ChatMessage = ({ msg, onReply, onScrollToMessage }: ChatMessageProps) => {
  const { authDetails } = useAuth();
  const isSender = msg.sender_id === authDetails?.user?.id;
  const styles = getMessageLayout(isSender);

  // ─── STATE─

  const [expanded, setExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  const textRef = useRef<HTMLDivElement>(null);

  // Detect overflow to decide whether to show "Read more"
  useEffect(() => {
    const el = textRef.current;
    if (el) {
      setShowReadMore(el.scrollHeight > el.clientHeight + 5);
    }
  }, [msg?.body]);

  const isUploading = msg.delivery_status === "uploading";
  const isSending = msg.delivery_status === "sending";
  const isFailed = msg.delivery_status === "failed";
  const isSent = msg.delivery_status === "sent";
  const isRead = !!msg.read_at;

  // ─── STATUS

  const renderStatus = () => {
    if (!isSender) return null;

    if (isUploading) return <LuClock size={10} className="animate-pulse" />;

    if (isFailed) return <AlertCircle size={12} className="text-red-500" />;

    if (isSending) return <LuClock size={10} />;

    if (isRead) return renderCheck("read");

    if (isSent) return renderCheck("sent");
    return <LuClock size={10} className="" />;
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

  // ─── RENDER

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
          className={`pr-10 ${!expanded ? "line-clamp-4" : ""}`}
        >
          {msg?.body}
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
