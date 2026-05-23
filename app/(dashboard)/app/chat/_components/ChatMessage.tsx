import { useEffect, useRef, useState } from "react";
import { getMessageLayout, renderCheck } from "@/app/_utils/formatters";
import { useAuth } from "@/app/context/AuthContext";
import { LuClock } from "react-icons/lu";
import SwipeableMessage from "./SwipeableMessage";
import ReplyPreview from "./ReplyPreview";

const ChatMessage = ({ msg, onReply }: any) => {
  const { authDetails } = useAuth();
  const isSender = msg.sender_id === authDetails?.user?.id;
  const styles = getMessageLayout(isSender);

  const [expanded, setExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  // Detect overflow
  useEffect(() => {
    const el = textRef.current;
    if (el) {
      // If the scroll height is significantly larger than client height, we need the button
      // Adding a small buffer (5px) to prevent false positives
      setShowReadMore(el.scrollHeight > el.clientHeight + 5);
    }
  }, [msg?.body]);

  const renderStatus = () => {
    if (!isSender) return null;
    if (msg.pending) return <LuClock size={10} />;
    if (msg.read_at) return renderCheck("read");
    return renderCheck("sent");
  };

  return (
    <SwipeableMessage
      isSender={isSender}
      onReply={() => onReply?.(msg)}
      className={styles.container}
    >
      <div
        className={`${styles.bubble} relative rounded-[10px] text-[13px]`}
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
        {msg.reply_to_message && (
          <ReplyPreview reply={msg.reply_to_message} isSender={isSender} />
        )}

        {/* Message Body with dynamic line-clamp */}
        <div
          ref={textRef}
          className={`pr-10 ${!expanded ? "line-clamp-4" : ""}`}
        >
          {msg?.body}
        </div>

        {/* Professional Read More Button */}
        {showReadMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="block text-[11px] mt-1 font-semibold opacity-60 hover:opacity-100 transition-opacity active:scale-95"
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        )}

        {/* Footer (Time & Status) */}
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
