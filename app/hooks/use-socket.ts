"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { websocket } from "../services/websocket";
import { useNotifications } from "../context/NotificationContext";

export const useSocketConnection = ({
  token,
  authUserId,
  setTypingUsers,
  setOnlineUsers,
  activeConversationId,
}: {
  token: string;
  authUserId: string;
  setTypingUsers: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setOnlineUsers: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  activeConversationId?: string;
}) => {
  const { pushNotification, incrementUnread, decrementUnread } =
    useNotifications();
  const queryClient = useQueryClient();

  const isConnected = useRef(false);

  useEffect(() => {
    if (!token || !authUserId) return;

    // 🔐 prevent duplicate connection
    if (!isConnected.current) {
      websocket.connect(token);
      isConnected.current = true;
    }

    const handleMessage = (message: any) => {
      const otherUserId =
        message.sender_id === authUserId
          ? message.recipient_id
          : message.sender_id;

      const isMyMessage = message.sender_id === authUserId;

      const isActiveChat =
        activeConversationId &&
        (message.sender_id === activeConversationId ||
          message.recipient_id === activeConversationId);

      // MESSAGES CACHE UPDATE
      queryClient.setQueryData(["messages", otherUserId], (old: any) => {
        if (!old) return old;

        const pages = [...old.pages];
        const items = pages[0].messages.items;

        const filtered = items.filter(
          (m: any) =>
            !(
              m.pending &&
              m.body === message.body &&
              m.sender_id === message.sender_id
            ),
        );

        const exists = filtered.some((m: any) => m.id === message.id);
        if (exists) return old;

        pages[0] = {
          ...pages[0],
          messages: {
            ...pages[0].messages,
            items: [...filtered, message],
          },
        };

        return { ...old, pages };
      });

      // CONVERSATIONS UPDATE
      queryClient.setQueryData(["conversations"], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((c: any) =>
              c.id === otherUserId
                ? {
                    ...c,
                    last_message: message.body,
                    last_message_at: message.created_at,
                  }
                : c,
            ),
          })),
        };
      });

      if (!isMyMessage && !isActiveChat) {
        pushNotification({
          id: message.id,
          conversation_id: message.conversation_id,
          sender_id: message.sender_id,
          sender_name: message.sender?.full_name,
          body: message.body,
          created_at: message.created_at,
        });

        incrementUnread(otherUserId);
      }
    };

    const handleTyping = ({ recipient_id }: any) => {
      setTypingUsers((prev) => ({
        ...prev,
        [recipient_id]: true,
      }));

      setTimeout(() => {
        setTypingUsers((prev) => ({
          ...prev,
          [recipient_id]: false,
        }));
      }, 2000);
    };

    const handleUserOnline = ({ user, online }: any) => {
      if (!user?.id) return;

      setOnlineUsers((prev) => {
        const next = { ...prev };
        if (online) next[user.id] = true;
        else delete next[user.id];
        return next;
      });
    };

    const handleReadUpdated = (data: any) => {
      const { reader_id, conversation_id, message_id, read } = data;

      if (!conversation_id || !message_id || !reader_id) return;
      if (read) {
        decrementUnread(reader_id);
      }

      queryClient.setQueryData(["messages", reader_id], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: {
              ...page.messages,
              items: page.messages.items.map((msg: any) =>
                msg.id === message_id
                  ? {
                      ...msg,
                      read_at: read ? new Date().toISOString() : null,
                      status: read ? "read" : "sent",
                    }
                  : msg,
              ),
            },
          })),
        };
      });
    };

    // SAFE SINGLE REGISTRATION

    websocket.off("chat.message", handleMessage);
    websocket.off("chat.sent", handleMessage);
    websocket.off("chat.typing", handleTyping);
    websocket.off("user.online", handleUserOnline);
    websocket.off("chat.read.updated", handleReadUpdated);

    websocket.on("chat.message", handleMessage);
    websocket.on("chat.sent", handleMessage);
    websocket.on("chat.typing", handleTyping);
    websocket.on("user.online", handleUserOnline);
    websocket.on("chat.read.updated", handleReadUpdated);

    return () => {
      websocket.off("chat.message", handleMessage);
      websocket.off("chat.sent", handleMessage);
      websocket.off("chat.typing", handleTyping);
      websocket.off("user.online", handleUserOnline);
      websocket.off("chat.read.updated", handleReadUpdated);
    };
  }, [token, authUserId, activeConversationId]);
};
