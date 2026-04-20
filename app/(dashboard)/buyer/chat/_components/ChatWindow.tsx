"use client";
import SendMessage from "./SendMessage";
import MessageList from "./MessageList";
import ChatHeader from "./ChatHeader";
import { useParams } from "next/navigation";

const ChatWindow = () => {
  const { chatId } = useParams();

  return (
    <div
      className={`flex-1 flex-col bg-white ${chatId ? "flex" : "hidden md:flex"}`}
    >
      {/* Header */}
      <ChatHeader />

      {/* Messages */}
      <MessageList />

      {/* Input Area */}
      {chatId && <SendMessage />}
    </div>
  );
};

export default ChatWindow;
