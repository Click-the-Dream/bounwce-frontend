import { getMessageLayout, renderCheck } from "@/app/_utils/formatters";
import { useAuth } from "@/app/context/AuthContext";

interface ChatMessageProps {
  msg: {
    body: string;
    timestamp: string;
    recipient_id: string;
    sender_id: string;
    isSender: boolean;
    created_at: string;
    id: string;
    updated_at: string;
    read_at: string | null;
  };
}
const ChatMessage = ({ msg }: any) => {
  const { authDetails } = useAuth();
  const isSender = msg.sender_id === authDetails?.user?.id;
  const styles = getMessageLayout(isSender);
  return (
    <div className={styles.container}>
      <div
        className={`${styles.bubble} p-4 rounded-[10px] text-[13px] relative pb-6 pr-12`}
        style={{
          boxShadow:
            "0px 0px 1.5px 0px #00000040, 0px 0px 0px 0px #00000040 inset",
        }}
      >
        {msg?.body}
        <span
          className={`absolute bottom-1.25 right-1.25 text-[10px] flex items-center gap-1 ${styles.time}`}
        >
          {msg?.created_at &&
            new Date(msg.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}

          {isSender && (
            <span className="text-[10px] opacity-80">
              {msg.read_at ? renderCheck("read") : renderCheck("sent")}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;
