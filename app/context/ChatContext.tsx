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
import { useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

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

  /**
   * Warm the conversation list after authentication.
   * Individual message threads are warmed by the visible ChatCard items so
   * the first visible batch is ready before the user opens a conversation.
   */
  const warmChatCache = useCallback(async () => {
    if (!authUserId) return;

    try {
      const response = await api.get("/chats/conversations", {
        params: { page: 1, page_size: 10 },
      });

      const page = response.data?.data;
      if (!page) return;

      queryClient.setQueryData(["conversations"], {
        pages: [page],
        pageParams: [1],
      });
    } catch (error) {
      console.warn("[CHAT] conversation warm-up failed", error);
    }
  }, [authUserId, queryClient]);

  useEffect(() => {
    if (!authUserId) return;
    void warmChatCache();
  }, [authUserId, warmChatCache]);

  const resetChatState = useCallback(() => {
    setSelectedChat(null);
    setReplyTo(null);
    setTypingUsers({});
    setOnlineUsers({});
    activeUploadsRef.current = new Map();
  }, []);

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
        warmChatCache,
        resetChatState,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatUtils = () => useContext(ChatContext);
