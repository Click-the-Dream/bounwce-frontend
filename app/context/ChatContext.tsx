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
  useEffect(() => {
    if (!authDetails?.user) return;

    // Pre-hydrate all conversations into the cache immediately on load
    const initDB = async () => {
      const db = getChatDB(authDetails.user.id);
      const cached = await db.conversations.toArray();
      queryClient.setQueriesData(
        { queryKey: ["conversations"] },
        (old: any) => {
          if (old) return old;

          return {
            pages: [
              {
                items: cached,
                page: 1,
                total: cached.length,
                page_size: cached.length,
              },
            ],
            pageParams: [1],
          };
        },
      );
    };
    initDB();
  }, [authDetails]);

  const prewarmMessages = async (userId: string) => {
    if (!authDetails?.user) return;

    // Don't overwrite if this chat is already cached — it's fresh enough
    const existing = queryClient.getQueryData(["messages", userId]);
    if (existing) return;

    const db = getChatDB(authDetails.user.id);
    const cached = await db.messages
      .where("conversation_id")
      .equals(userId)
      .toArray();

    if (cached.length === 0) return;

    const normalized = cached.map((m: any) => ({
      ...m,
      delivery_status: m.delivery_status ?? "sent",
      synced: m.synced ?? true,
    }));

    // Set cache synchronously — this runs before router.push resolves,
    // so by the time Next.js renders MessageList the data is already there
    queryClient.setQueryData(["messages", userId], {
      pages: [
        {
          messages: {
            items: normalized,
            page: 1,
            total: normalized.length,
            page_size: normalized.length,
          },
        },
      ],
      pageParams: [1],
    });
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
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatUtils = () => useContext(ChatContext);
