"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ReplyTarget } from "../_utils/types/buyer";
import { useAuth } from "./AuthContext";
import { getChatDB } from "../store/chat-store";
import { useQueryClient } from "@tanstack/react-query";

export const ChatContext = createContext<any>({});

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { authDetails } = useAuth();
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, true>>({});

  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);

  const activeUploadsRef = useRef(new Map<string, File[]>());
  const prewarmedCacheRef = useRef<Record<string, any>>({});

  const prewarmMessages = async (userId: string) => {
    if (!authDetails?.user) return;
    const db = getChatDB(authDetails.user.id);

    const cached = await db.messages
      .where("recipient_id") // Ensure this matches your DB index
      .equals(userId)
      .toArray();

    const sorted = cached.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );

    const data = {
      pages: [
        {
          messages: {
            items: sorted,
            page: 1,
            total: sorted.length,
            page_size: sorted.length,
          },
        },
      ],
      pageParams: [1],
    };

    // Store in ref so useChat can access it immediately
    prewarmedCacheRef.current[userId] = data;
    return data;
  };

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
        activeUploadsRef,
        prewarmMessages,
        prewarmedCacheRef,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatUtils = () => useContext(ChatContext);
