"use client";
import { LuImage, LuVideo, LuFile, LuMic } from "react-icons/lu";
import { formatTime } from "@/app/_utils/formatters";
import { useChatUtils } from "@/app/context/ChatContext";
import { useParams, useRouter } from "next/navigation";
import UserImage from "../../_components/UserImage";
import { useAuth } from "@/app/context/AuthContext";
import { ChatUser } from "@/app/_utils/types/chat";
import { useNotifications } from "@/app/context/NotificationContext";
import { useEffect, useRef } from "react";
import { useIsFetching } from "@tanstack/react-query";
import useChat from "@/app/hooks/use-chat";

const ChatCard = ({ chat }: { chat: ChatUser }) => {
  const { chatId } = useParams();
  const router = useRouter();
  const { authDetails } = useAuth();
  const { resetUnread } = useNotifications();
  const { typingUsers } = useChatUtils();
  const { prefetchMessages } = useChat();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const chatUser = chat?.user;
  const currentUserId = authDetails?.user?.id;

  const isTyping = chatUser?.id ? !!typingUsers?.[chatUser.id] : false;
  const lastMessageTime = chat?.last_message?.created_at;
  const lastMessage = chat?.last_message;
  const isMine = lastMessage?.sender_id === currentUserId;

  const messagesFetching =
    useIsFetching({
      queryKey: ["messages", chatUser?.id],
    }) > 0;

  useEffect(() => {
    const element = cardRef.current;
    if (!element || !chatUser?.id) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;

        void prefetchMessages(chatUser.id).catch((error) => {
          console.debug("[CHAT] background prefetch skipped", {
            userId: chatUser.id,
            error,
          });
        });
      },
      {
        root: null,
        rootMargin: "180px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [chatUser?.id, prefetchMessages]);

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
            <span className="truncate">{caption || "Photo"}</span>
          </span>
        );

      case "video":
        return (
          <span className={mediaClass}>
            <LuVideo className="text-[13px]" />
            <span className="truncate">{caption || "Video"}</span>
          </span>
        );

      case "file":
        return (
          <span className={mediaClass}>
            <LuFile className="text-[13px]" />
            <span className="truncate">{caption || body || "Document"}</span>
          </span>
        );

      case "audio":
        return (
          <span className={mediaClass}>
            <LuMic className="text-[13px]" />
            <span className="truncate">{caption || "Voice message"}</span>
          </span>
        );

      default:
        return <span className="truncate">{body || caption || "Message"}</span>;
    }
  };

  const goToChat = async () => {
    resetUnread(chatUser.id);

    router.push(`/app/chat/${chatUser.id}`);
  };

  return (
    <div
      ref={cardRef}
      onClick={() => void goToChat()}
      key={chatUser?.id}
      className={`relative flex items-center gap-3 pt-3.25 pb-4.75 px-1 cursor-pointer hover:bg-gray-50 border-b-[0.53px] border-[#00000033] h-15.75 ${chatId === chatUser.id ? "bg-gray-100" : ""}`}
    >
      <UserImage user={chatUser} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h4 className="font-medium text-sm truncate pr-10 ">
            {chatUser.full_name}
          </h4>
          <span className="text-[10px] text-gray-400">
            {formatTime(lastMessageTime)}
          </span>
          {chat?.unread_count > 0 && (
            <span className="absolute right-0 bottom-5 bg-red-500 text-white text-[10px] px-1 min-w-4 h-4 rounded-full flex items-center justify-center">
              {chat.unread_count}
            </span>
          )}
        </div>
        <div
          className={`flex min-w-0 items-center text-[13px] truncate mt-0.5 pr-10 ${
            isTyping ? "text-orange" : "text-[#A1A1A1]"
          }`}
        >
          <p className="min-w-0 truncate">
            {isTyping ? (
              <span className="animate-pulse">typing...</span>
            ) : messagesFetching ? (
              <span className="inline-flex items-center gap-1.5 text-gray-400">
                <span
                  className="size-1.5 shrink-0 animate-pulse rounded-full bg-gray-300"
                  aria-hidden="true"
                />
                <span>Loading messages...</span>
              </span>
            ) : lastMessage ? (
              <span className="flex items-center gap-1">
                {isMine && <span className="text-gray-600">You: </span>}
                {renderLastMessage()}
              </span>
            ) : (
              `Start a conversation`
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatCard;
