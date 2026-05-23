import { getMessageLayout, renderCheck } from "@/app/_utils/formatters";
import { useAuth } from "@/app/context/AuthContext";
import { LuClock } from "react-icons/lu";
import { Reply } from "lucide-react";
import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useRef } from "react";
import SwipeableMessage from "./SwipeableMessage";

const SWIPE_THRESHOLD = 48;

const ChatMessage = ({ msg, onReply }: any) => {
  const { authDetails } = useAuth();
  const isSender = msg.sender_id === authDetails?.user?.id;
  const styles = getMessageLayout(isSender);
  const controls = useAnimation();
  const triggeredRef = useRef(false);

  const x = useMotionValue(0);

  // Icon reveals as bubble slides away
  const iconOpacity = useTransform(
    x,
    isSender ? [-SWIPE_THRESHOLD, -16, 0] : [0, 16, SWIPE_THRESHOLD],
    [1, 0.4, 0],
  );
  const iconScale = useTransform(
    x,
    isSender ? [-SWIPE_THRESHOLD, -16, 0] : [0, 16, SWIPE_THRESHOLD],
    [1.15, 0.85, 0.6],
  );

  const handleDrag = () => {
    const current = x.get();
    const overThreshold = isSender
      ? current < -SWIPE_THRESHOLD
      : current > SWIPE_THRESHOLD;
    if (overThreshold && !triggeredRef.current) {
      triggeredRef.current = true;
    }
  };

  const handleDragEnd = () => {
    const current = x.get();
    const triggered = isSender
      ? current < -SWIPE_THRESHOLD
      : current > SWIPE_THRESHOLD;
    if (triggered) onReply?.(msg);
    triggeredRef.current = false;
    controls.start({
      x: 0,
      transition: { type: "spring", stiffness: 400, damping: 30 },
    });
  };

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
        className={`${styles.bubble} p-4 rounded-[10px] text-[13px] relative pb-6`}
        style={{
          boxShadow: "0px 0px 1.5px 0px #00000040",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          whiteSpace: "pre-wrap",
          borderTopLeftRadius: msg.reply_to && !isSender ? "0" : undefined,
          borderTopRightRadius: msg.reply_to && isSender ? "0" : undefined,
          paddingTop: msg?.reply_to && "6px",
        }}
      >
        {msg.reply_to && (
          <div
            className={`mb-1 px-3 py-2 rounded-lg text-xs overflow-hidden w-full ${
              isSender
                ? "bg-black/10 border-l-4 border-white/30"
                : "bg-black/5 border-l-4 border-black/10"
            }`}
          >
            <div className="font-semibold text-[11px] opacity-70 mb-0.5">
              {msg.reply_to.sender_id === authDetails?.user?.id
                ? "You"
                : msg.reply_to?.sender?.full_name || "Them"}
            </div>
            <div className="truncate text-[12px] opacity-90">
              {msg.reply_to.body || "Message unavailable"}
            </div>
          </div>
        )}
        <span className="pr-12">{msg?.body}</span>
        <span
          className={`absolute bottom-1.25 right-1.25 text-[10px] flex items-center gap-1 ${styles.time}`}
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

export default ChatMessage;
