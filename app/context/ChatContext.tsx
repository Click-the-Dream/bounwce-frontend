"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { ReplyTarget } from "../_utils/types/buyer";
import { useAuth } from "./AuthContext";
import { getChatDB } from "../store/chat-store";
import { useQueryClient } from "@tanstack/react-query";

export const ChatContext = createContext<any>({});

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { authDetails } = useAuth();
  const authUserId = authDetails?.user?.id;
  const queryClient = useQueryClient();

  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, true>>({});
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);

  const activeUploadsRef = useRef(new Map<string, File[]>());
  const prewarmedCacheRef = useRef<Record<string, any>>({});

  // Single shared DB ref — all hooks read chatDBRef.current, never call
  // getChatDB() themselves. Re-assigned whenever the authenticated user changes.
  const chatDBRef = useRef<ReturnType<typeof getChatDB> | null>(null);

  useEffect(() => {
    if (!authUserId) {
      chatDBRef.current = null;
      return;
    }
    chatDBRef.current = getChatDB(authUserId);
  }, [authUserId]);

  // Helper used internally and exposed so any hook can get a live, open DB
  // without going through getChatDB() directly.
  const getDB = useCallback(async () => {
    if (!authUserId) return null;

    // Re-create if missing
    if (!chatDBRef.current) {
      chatDBRef.current = getChatDB(authUserId);
    }

    // Re-open if Dexie closed it (idle timeout, tab visibility, etc.)
    if (!chatDBRef.current.isOpen()) {
      try {
        await chatDBRef.current.open();
      } catch (err) {
        console.error("Failed to re-open chatDB:", err);
        // Re-create as a last resort
        chatDBRef.current = getChatDB(authUserId);
        await chatDBRef.current.open();
      }
    }

    return chatDBRef.current;
  }, [authUserId]);

  const resetChatState = useCallback(() => {
    prewarmedCacheRef.current = {};
    setSelectedChat(null);
    setReplyTo(null);
    setTypingUsers({});
    setOnlineUsers({});
    activeUploadsRef.current = new Map();
    chatDBRef.current = null;
  }, []);

  const prewarmMessages = useCallback(
    async (userId: string) => {
      const db = await getDB();
      if (!db) return null;

      const cached = await db.messages
        .where("peer_id")
        .equals(userId)
        .toArray();

      const sorted = cached.sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      const existing = queryClient.getQueryData(["messages", userId]) as any;

      const existingItems = existing?.pages?.[0]?.messages?.items ?? [];

      const existingIds = new Set(existingItems.map((m: any) => m.id));

      const merged = [
        ...sorted.filter((m: any) => !existingIds.has(m.id)),
        ...existingItems,
      ].sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

      // Nothing to prewarm
      if (merged.length === 0) {
        delete prewarmedCacheRef.current[userId];
        return null;
      }

      const data = {
        pages: [
          {
            messages: {
              items: merged,
              page: 1,
              total: merged.length,
              page_size: merged.length,
            },
          },
        ],
        pageParams: [1],
      };

      prewarmedCacheRef.current[userId] = data;

      queryClient.setQueryData(["messages", userId], data);

      return data;
    },
    [getDB, queryClient],
  );

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
        resetChatState,
        chatDBRef, // raw ref — for sync reads inside useRef closures
        getDB, // async helper — use this anywhere you need a safe open DB
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatUtils = () => useContext(ChatContext);
