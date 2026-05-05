"use client";
import SendMessage from "./SendMessage";
import MessageList from "./MessageList";
import ChatHeader from "./ChatHeader";
import { useParams } from "next/navigation";
import { User } from "@/app/_utils/types/buyer";

const ChatWindow = ({
  selectedUser,
  isConversationLoading,
}: {
  selectedUser: User;
  isConversationLoading: boolean;
}) => {
  const { chatId } = useParams();

  if (chatId && isConversationLoading && !selectedUser) {
    return (
      <div className="flex-1 flex flex-col">
        {/* HEADER SKELETON */}
        <div className="h-16 border-b flex items-center px-4 gap-3">
          <div className="w-10 h-10 bg-gray-200 animate-pulse rounded-lg" />
          <div className="flex flex-col gap-2">
            <div className="w-32 h-3 bg-gray-200 animate-pulse rounded" />
            <div className="w-20 h-2 bg-gray-100 animate-pulse rounded" />
          </div>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 p-4 space-y-4">
          {[...Array(8)].map((_, i) => {
            const isMe = i % 2 === 0;

            return (
              <div
                key={i}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
            animate-pulse rounded-2xl px-4 py-3
            ${isMe ? "bg-gray-200" : "bg-gray-100"}
          `}
                  style={{
                    width: `${Math.random() * 40 + 30}%`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div
      className={`flex-1 flex-col bg-white ${chatId ? "flex" : "hidden md:flex"}`}
    >
      {/* Header */}
      <ChatHeader selectedChat={selectedUser} />

      {/* Messages */}
      <MessageList selectedChat={selectedUser} />

      {/* Input Area */}
      {chatId && <SendMessage selectedChat={selectedUser} />}
    </div>
  );
};

export default ChatWindow;
