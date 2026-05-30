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
  const queryClient = useQueryClient();

  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [onlineUsers, setOnlineUsers] = useState<Record<string, true>>({});
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);

  const activeUploadsRef = useRef(new Map<string, File[]>());

  // FIX (Bug 6): prewarmedCacheRef must be a plain ref — not derived from
  // a stale user. It gets wiped in resetChatState() on logout.
  const prewarmedCacheRef = useRef<Record<string, any>>({});

  // FIX (Bug 6 + logout): central reset called by useAuthServices on logout
  // and by safeLogout in AuthContext. Clears every piece of in-memory chat
  // state so User B never sees User A's data.
  const resetChatState = useCallback(() => {
    prewarmedCacheRef.current = {};
    setSelectedChat(null);
    setReplyTo(null);
    setTypingUsers({});
    setOnlineUsers({});
    activeUploadsRef.current = new Map();
  }, []);

  const prewarmMessages = useCallback(
    async (userId: string) => {
      if (!authDetails?.user?.id) return null;

      const db = getChatDB(authDetails.user.id);

      const cached = await db.messages
        .where("peer_id")
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

      prewarmedCacheRef.current[userId] = data;
      return data;
    },
    [authDetails?.user?.id],
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
        resetChatState, // FIX: exposed so logout can call it
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatUtils = () => useContext(ChatContext);
