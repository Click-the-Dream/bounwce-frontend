"use client";
import { createContext, useContext, useState } from "react";
import { ReplyTarget } from "../_utils/types/buyer";

export const ChatContext = createContext<any>({});

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, true>>({});

  // Reply state — lifted here so both MessageList and SendMessage share it
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        typingUsers,
        setTypingUsers,
        onlineUsers,
        setOnlineUsers,
        replyTo,
        setReplyTo,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatUtils = () => useContext(ChatContext);
