"use client";
import { createContext, useContext, useState } from "react";

export const ChatContext = createContext<any>({});

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, true>>({});

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        typingUsers,
        setTypingUsers,
        onlineUsers,
        setOnlineUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatUtils = () => useContext(ChatContext);
