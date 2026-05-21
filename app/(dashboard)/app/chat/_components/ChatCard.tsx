"use client";
import { LuImage, LuVideo, LuFile, LuMic } from "react-icons/lu";
import { formatTime } from "@/app/_utils/formatters";
import { useChatUtils } from "@/app/context/ChatContext";
import { useNotifications } from "@/app/context/NotificationContext";
import { useParams, useRouter } from "next/navigation";
import UserImage from "../../_components/UserImage";
import { useAuth } from "@/app/context/AuthContext";

const ChatCard = ({ chat }: any) => {
  const { chatId } = useParams();
  const router = useRouter();
  const { authDetails } = useAuth();
  const { typingUsers } = useChatUtils();
  const { unreadCount } = useNotifications();
  const chatUser = chat?.user;
  const currentUserId = authDetails?.user?.id;

  const isTyping = chatUser?.id ? !!typingUsers?.[chatUser.id] : false;
  const lastMessageTime = chat?.last_message?.created_at;
  const lastMessage = chat?.last_message;
  const isMine = lastMessage?.sender_id === currentUserId;

  const renderLastMessage = () => {
    if (!lastMessage) {
      return `@${chatUser.username}`;
    }

    const caption = lastMessage.caption?.trim();
    const body = lastMessage.body?.trim();
    const mediaType = lastMessage.media_type;

    const mediaClass = "inline-flex items-center gap-1 ";

    switch (mediaType) {
      case "image":
        return (
          <span className={mediaClass}>
            <LuImage className="text-[13px]" />
            <span>{caption || "Photo"}</span>
          </span>
        );

      case "video":
        return (
          <span className={mediaClass}>
            <LuVideo className="text-[13px]" />
            <span>{caption || "Video"}</span>
          </span>
        );

      case "file":
        return (
          <span className={mediaClass}>
            <LuFile className="text-[13px]" />
            <span>{caption || body || "Document"}</span>
          </span>
        );

      case "audio":
        return (
          <span className={mediaClass}>
            <LuMic className="text-[13px]" />
            <span>{caption || "Voice message"}</span>
          </span>
        );

      default:
        return body || caption || "Message";
    }
  };

  return (
    <div
      onClick={() => router.push(`/app/chat/${chatUser.id}`)}
      key={chatUser?.id}
      className={`flex items-center gap-3 pt-3.25 pb-4.75 px-1 cursor-pointer hover:bg-gray-50 border-b-[0.53px] border-[#00000033] h-15.75 ${chatId === chatUser.id ? "bg-gray-100" : ""}`}
    >
      <UserImage user={chatUser} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h4 className="font-medium text-sm truncate">{chatUser.full_name}</h4>
          <span className="text-[10px] text-gray-400">
            {formatTime(lastMessageTime)}
          </span>
          {unreadCount[chatUser.id] > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1 min-w-4 h-4 rounded-full flex items-center justify-center">
              {unreadCount[chatUser.id]}
            </span>
          )}
        </div>
        <p
          className={`text-[13px] truncate mt-0.5 pr-10 ${
            isTyping ? "text-orange animate-pulse" : "text-[#A1A1A1]"
          }`}
        >
          {isTyping ? (
            "typing..."
          ) : lastMessage ? (
            <span className="flex items-center gap-1 line-clamp-1">
              {isMine && <span className="text-gray-600">You: </span>}
              {renderLastMessage()}
            </span>
          ) : (
            `@${chatUser.username}`
          )}
        </p>
      </div>
    </div>
  );
};

export default ChatCard;
