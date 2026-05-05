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

  if (chatId && isConversationLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading chat...</div>
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
