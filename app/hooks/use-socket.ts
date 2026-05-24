"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { websocket } from "../services/websocket";
import { useNotifications } from "../context/NotificationContext";
import { onMessageToast } from "../_utils/message-toast";
import { getChatDB } from "../store/chat-store";
import { useChatUtils } from "../context/ChatContext";

export const useSocketConnection = ({
  authUserId,
  activeConversationId,
}: {
  authUserId: string;
  activeConversationId?: string;
}) => {
  const queryClient = useQueryClient();
  const chatDB = getChatDB(authUserId);

  const { pushNotification, incrementUnread, decrementUnread } =
    useNotifications();
  const { setTypingUsers, setOnlineUsers } = useChatUtils();

  const setTypingUsersRef = useRef(setTypingUsers);
  const setOnlineUsersRef = useRef(setOnlineUsers);

  useEffect(() => {
    setTypingUsersRef.current = setTypingUsers;
    setOnlineUsersRef.current = setOnlineUsers;
  }, [setTypingUsers, setOnlineUsers]);

  // latest active chat without rerender/reconnect
  const activeChatRef = useRef<string | undefined>(activeConversationId);
  const authUserRef = useRef(authUserId);

  useEffect(() => {
    authUserRef.current = authUserId;
  }, [authUserId]);

  useEffect(() => {
    activeChatRef.current = activeConversationId;
  }, [activeConversationId]);

  //  SOCKET CONNECT ONLY ON TOKEN CHANGE
  useEffect(() => {
    const handleMessage = async (raw: any) => {
      const message = raw.message || raw;
      const otherUserId =
        message.sender_id === authUserId
          ? message.recipient_id
          : message.sender_id;
      const conversationId = message.conversation_id;

      const isMyMessage =
        String(message.sender_id) === String(authUserRef.current);

      const activeChatId = activeChatRef.current;
      const isActiveChat =
        activeChatId &&
        (message.sender_id === activeChatId ||
          message.recipient_id === activeChatId);

      // ---------------- MESSAGES CACHE ----------------

      queryClient.setQueryData(["messages", otherUserId], (old: any) => {
        if (!old) return old;

        const pages = [...old.pages];
        const items = pages[0]?.messages?.items || [];

        // 1. Strip pending text duplicate
        let filtered = items.filter(
          (m: any) =>
            !(
              m.pending &&
              m.body === message.body &&
              m.sender_id === message.sender_id
            ),
        );

        // 2. Replace optimistic media message by client_id
        // The optimistic message was created with client_id = optimistic.id
        // When server echoes it back with the same client_id, we match and replace
        if (message.client_id) {
          const index = filtered.findIndex(
            (m: any) => m.client_id === message.client_id,
          );

          if (index !== -1) {
            const oldMsg = filtered[index];

            filtered[index] = {
              ...oldMsg,
              ...message,
              local_url: undefined,
              local_urls: undefined,
              delivery_status: "sent",
              pending: false,
            };

            pages[0] = {
              ...pages[0],
              messages: {
                ...pages[0].messages,
                items: filtered,
              },
            };

            return {
              ...old,
              pages,
            };
          }
        }

        // 3. Fallback: normal dedup by real id
        const exists = filtered.some((m: any) => m.id === message.id);
        if (exists) return old;

        pages[0] = {
          ...pages[0],
          messages: {
            ...pages[0].messages,
            items: [...filtered, { ...message, delivery_status: "sent" }],
          },
        };

        return {
          ...old,
          pages,
        };
      });

      // ---------------- INDEXEDDB ----------------

      // If this was an optimistic message (had client_id), delete the old one
      if (message.client_id) {
        await chatDB.messages.delete(message.client_id);
      }

      await chatDB.messages.put({
        ...message,
        conversation_id: otherUserId,
        synced: true,
      });

      // ---------------- CONVERSATIONS ----------------

      await chatDB.conversations.update(conversationId, {
        last_message: {
          body: message.body,
          caption: message.caption,
          created_at: message?.created_at,
          updated_at: message?.updated_at,
          media_type: message?.media_type,
          media_url: message?.media_url,
          sender_id: message?.sender_id,
        },
        updated_at: new Date().toISOString(),
      });

      queryClient.setQueryData(["conversations"], (old: any) => {
        if (!old) return old;

        const pages = old.pages.map((page: any) => {
          const items = [...page.items];

          const index = items.findIndex(
            (c: any) => c.user?.id === otherUserId || c.id === otherUserId,
          );

          if (index === -1) return page;

          const conversation = items[index];

          const updated = {
            ...conversation,
            last_message: {
              body: message.body,
              created_at: message?.created_at,
              updated_at: message?.updated_at,
              media_type: message?.media_type,
              media_url: message?.media_url,
              sender_id: message?.sender_id,
            },
          };

          items.splice(index, 1);
          items.unshift(updated);

          return { ...page, items };
        });

        return { ...old, pages };
      });

      // ---------------- NOTIFICATIONS ----------------

      if (!isMyMessage && !isActiveChat) {
        pushNotification({
          id: message.id,
          conversation_id: message.conversation_id,
          sender_id: message.sender_id,
          sender_name: message.sender?.full_name,
          body: message.body,
          created_at: message.created_at,
        });

        onMessageToast({
          senderName: message.sender?.full_name,
          message: message.body,
          avatar: message.sender?.avatar,
          conversationId: message.conversation_id,
          userId: otherUserId,
        });

        incrementUnread(otherUserId);
      }
    };

    const handleTyping = (raw: any) => {
      const data = raw.data || raw;

      const userId = data?.user?.id;

      if (!userId) return;

      setTypingUsersRef.current((prev: any) => ({
        ...prev,
        [userId]: data.is_typing,
      }));
    };

    const handleUserOnline = ({ user, online }: any) => {
      if (!user?.id) return;

      setOnlineUsersRef.current((prev: any) => {
        const next = { ...prev };

        if (online) {
          next[user.id] = true;
        } else {
          delete next[user.id];
        }

        return next;
      });
    };

    const handleReadUpdated = (data: any) => {
      const { reader_id, message_id, read } = data;

      if (!reader_id || !message_id) return;

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

    const handleOnlineSnapshot = (data: any) => {
      const items = data?.items || [];

      const onlineMap: Record<string, boolean> = {};

      items.forEach((item: any) => {
        if (item?.user?.id && item.online) {
          onlineMap[item.user.id] = true;
        }
      });

      setOnlineUsersRef.current(() => onlineMap);
    };

    // CLEAN BEFORE REGISTERING

    websocket.off("chat.message", handleMessage);
    websocket.off("chat.sent", handleMessage);
    websocket.off("chat.typing", handleTyping);
    websocket.off("user.online", handleUserOnline);
    websocket.off("user.online.snapshot", handleOnlineSnapshot);
    websocket.off("chat.read.updated", handleReadUpdated);

    websocket.on("chat.message", handleMessage);
    websocket.on("chat.sent", handleMessage);
    websocket.on("chat.typing", handleTyping);
    websocket.on("user.online", handleUserOnline);
    websocket.on("user.online.snapshot", handleOnlineSnapshot);
    websocket.on("chat.read.updated", handleReadUpdated);

    return () => {
      websocket.off("chat.message", handleMessage);
      websocket.off("chat.sent", handleMessage);
      websocket.off("chat.typing", handleTyping);
      websocket.off("user.online", handleUserOnline);
      websocket.off("user.online.snapshot", handleOnlineSnapshot);
      websocket.off("chat.read.updated", handleReadUpdated);
    };
  }, [authUserId]);
};
