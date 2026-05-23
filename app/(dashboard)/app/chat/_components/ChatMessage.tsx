import { getMessageLayout, renderCheck } from "@/app/_utils/formatters";
import { useAuth } from "@/app/context/AuthContext";
import { LuClock } from "react-icons/lu";
import SwipeableMessage from "./SwipeableMessage";
import ReplyPreview from "./ReplyPreview";

const ChatMessage = ({ msg, onReply }: any) => {
  const { authDetails } = useAuth();
  const isSender = msg.sender_id === authDetails?.user?.id;
  const styles = getMessageLayout(isSender);

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
          padding: msg?.reply_to && "6px",
        }}
      >
        {msg.reply_to && (
          <ReplyPreview reply={msg.reply_to} isSender={isSender} />
        )}

        <span
          className="pr-12"
          style={{
            paddingLeft: msg.reply_to && "10px",
          }}
        >
          {msg?.body}
        </span>
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
