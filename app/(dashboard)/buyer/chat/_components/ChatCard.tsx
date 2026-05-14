"use client";
import SafeImage from "@/app/_components/SafeImage";
import { formatTime } from "@/app/_utils/formatters";
import { useChatUtils } from "@/app/context/ChatContext";
import { useNotifications } from "@/app/context/NotificationContext";
import { useParams, useRouter } from "next/navigation";

const ChatCard = ({ chat }: any) => {
  const { chatId } = useParams();
  const router = useRouter();
  const { onlineUsers, typingUsers } = useChatUtils();
  const { unreadCount } = useNotifications();
  const chatUser = chat?.user;

  const isOnline = chatUser?.id ? !!onlineUsers?.[chatUser.id] : false;
  const isTyping = chatUser?.id ? !!typingUsers?.[chatUser.id] : false;
  const lastMessageTime = chat?.last_message?.created_at;
  const lastMessage = chat?.last_message?.body;

  return (
    <div
      onClick={() => router.push(`/buyer/chat/${chatUser.id}`)}
      key={chatUser?.id}
      className={`flex items-center gap-3 pt-3.25 pb-4.75 px-1 cursor-pointer hover:bg-gray-50 border-b-[0.53px] border-[#00000033] h-15.75 ${chatId === chatUser.id ? "bg-gray-100" : ""}`}
    >
      <div
        className="relative shrink-0 rounded-[10px]  border border-white"
        style={{
          boxShadow:
            "0px 0px 2.03px 0.51px #00000040, 0.51px -3.05px 2.03px 1.52px #00000040 inset",
        }}
      >
        {chatUser.profile ? (
          <SafeImage
            src={chatUser.profile.url}
            alt="Profile"
            width={40}
            height={40}
            className="w-9.25 h-9.25 rounded-[10px] object-cover"
          />
        ) : (
          <div className="w-9.25 h-9.25 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-black">
            {chatUser.full_name?.slice(0, 2) || "NA"}
          </div>
        )}
        {isOnline && (
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-[0.83px] border-white rounded-full" />
        )}
      </div>
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
          className={`text-[13px] truncate mt-0.5 ${
            isTyping ? "text-orange animate-pulse" : "text-[#A1A1A1]"
          }`}
        >
          {isTyping
            ? "typing..."
            : lastMessage
              ? lastMessage
              : `@${chatUser.username}`}
        </p>
      </div>
    </div>
  );
};

export default ChatCard;
