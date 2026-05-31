"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { websocket } from "../services/websocket";
import { useNotifications } from "../context/NotificationContext";
import { onMessageToast } from "../_utils/message-toast";
import { useChatUtils } from "../context/ChatContext";
import { syncEntity } from "../helpers/db-sync";
import { useAuth } from "../context/AuthContext";
import { replaceOptimisticMessage } from "./use-chat";

export const useSocketConnection = ({
  authUserId,
  activeConversationId,
}: {
  authUserId: string;
  activeConversationId?: string;
}) => {
  const queryClient = useQueryClient();
  const { authDetails } = useAuth();

  const { pushNotification, decrementUnread } = useNotifications();
  const { setTypingUsers, setOnlineUsers, getDB } = useChatUtils();

  const setTypingUsersRef = useRef(setTypingUsers);
  const setOnlineUsersRef = useRef(setOnlineUsers);
  const readQueue = useRef<
    Record<string, Array<{ message_id: string; read: boolean }>>
  >({});
  const flushRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTypingUsersRef.current = setTypingUsers;
    setOnlineUsersRef.current = setOnlineUsers;
  }, [setTypingUsers, setOnlineUsers]);

  const activeChatRef = useRef<string | undefined>(activeConversationId);
  const authUserRef = useRef(authUserId);

  useEffect(() => {
    authUserRef.current = authUserId;
  }, [authUserId]);

  useEffect(() => {
    if (authDetails?.access_token) {
      websocket.connect(authDetails.access_token);
    } else if (!authDetails) {
      websocket.disconnect();
    }
  }, [authDetails?.access_token]);

  useEffect(() => {
    activeChatRef.current = activeConversationId;

    if (!activeConversationId) return;

    (async () => {
      const db = await getDB();

      syncEntity({
        db,
        queryClient,
        store: "conversations",
        key: "peer_id",
        keyValue: activeConversationId,
        queryKey: ["conversations", {}],
        selector: (old: any, updater: any) => {
          if (!old?.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items?.map((c: any) =>
                c.peer_id === activeConversationId ||
                c.user?.id === activeConversationId
                  ? updater(c)
                  : c,
              ),
            })),
          };
        },
        updater: (c: any) => {
          if (!c) return c;
          return { ...c, unread_count: 0 };
        },
      });
    })();
  }, [activeConversationId]);

  useEffect(() => {
    return () => {
      if (flushRef.current) clearTimeout(flushRef.current);
    };
  }, []);

  useEffect(() => {
    const handleMessage = async (raw: any) => {
      const event = raw.type;
      const payload = raw.data ?? raw.payload ?? raw;
      const incoming = payload.message ?? payload;

      const clientId = raw.client_id ?? payload.client_id;

      const message = {
        ...incoming,
        peer_id:
          incoming.sender_id === authUserRef.current
            ? incoming.recipient_id
            : incoming.sender_id,
      };
      const otherUserId =
        message.sender_id === authUserRef.current
          ? message.recipient_id
          : message.sender_id;

      const isMyMessage =
        String(message.sender_id) === String(authUserRef.current);

      const activeChatId = activeChatRef.current;
      const isActiveChat = !!activeChatId && otherUserId === activeChatId;

      // ---------------- MESSAGES CACHE ----------------
      const db = await getDB();
      await syncEntity({
        db,
        queryClient,
        store: "messages",
        key: "id",
        keyValue: message.id,
        queryKey: ["messages", otherUserId],
        // Update your syncEntity selector for messages like this:
        selector: (old: any, updater: any) => {
          if (!old?.pages) return old;

          const pages = old.pages.map((page: any) => {
            const items = page.messages?.items ?? [];

            const exists = items.some(
  (i) =>
    i.id === message.id ||
    i.client_id === message.client_id
);
            const newItems = exists
              ? items.map((i: any) => ((i.id === message.id || i.client_id === message.client_id)  ? updater(i) : i))
              : [...items, updater(message)];

            return {
              ...page,
              messages: {
                ...page.messages,
                items: newItems,
              },
            };
          });

          return { ...old, pages };
        },
        updater: (m: any) => ({
          ...m,
          id: message.id,
          ...message,
          pending: false,
          delivery_status: "sent",
        }),
      });

      await syncEntity({
        db,
        queryClient,
        store: "conversations",
        key: "peer_id",
        keyValue: otherUserId,
        queryKey: ["conversations", {}],
        selector: (old: any, updater: any) => {
          if (!old?.pages) return old;

          let found = false;
          let updatedConversation: any = null;

          // Update the conversation in place first
          const pages = old.pages.map((page: any) => ({
            ...page,
            items: (page.items ?? []).map((c: any) => {
              const isMatch =
                c.peer_id === otherUserId || c.user?.id === otherUserId;
              if (isMatch) {
                found = true;
                updatedConversation = updater(c);
                return updatedConversation;
              }
              return c;
            }),
          }));

          if (!found) return { ...old, pages };

          const firstPage = pages[0];
          const others = (firstPage.items ?? []).filter(
            (c: any) => c.peer_id !== otherUserId && c.user?.id !== otherUserId,
          );

          return {
            ...old,
            pages: [
              {
                ...firstPage,
                items: [updatedConversation, ...others],
              },
              ...pages.slice(1),
            ],
          };
        },
        updater: (c: any) => {
          if (!c) return c;

          // Ensure last_message is an object, even if it was previously false
          const existingLastMessage =
            typeof c.last_message === "object" && c.last_message !== null
              ? c.last_message
              : {};

          return {
            ...c,
            last_message: {
              ...existingLastMessage,
              body: message.body,
              caption: message.caption,
              created_at: message.created_at || new Date().toISOString(),
              updated_at: message.updated_at || new Date().toISOString(),
              media_type: message.media_type,
              media_url: message.media_url,
              sender_id: message.sender_id,
            },
            updated_at: message.updated_at || new Date().toISOString(),
            unread_count: isActiveChat
              ? 0
              : !isMyMessage
                ? (c.unread_count || 0) + 1
                : c.unread_count,
          };
        },
      });

      // ---------------- NOTIFICATIONS ----------------

      if (!isMyMessage && !isActiveChat) {
        pushNotification({
          id: crypto.randomUUID(),
          title: message.sender?.full_name || "New Message",
          body: message.body,
          media_type: message?.media_type,
          media_url: message?.media_url,
          event_type: "chat_message",
          payload: {
            route: "chat.conversation",
            sender: message.sender,
            message_id: message.id,
            conversation_id: message.conversation_id,
          },
          read_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: authUserRef.current,
        });

        onMessageToast({
          senderName: message.sender?.full_name,
          message: message.body,
          avatar: message.sender?.avatar,
          conversationId: message.conversation_id,
          profile_pic: message?.sender?.profile_pic,
          userId: message.sender_id,
        });
      }
    };

    const handleMessageAck = async (raw: any) => {
      const clientId = raw.client_id;
      const payload = raw.data?.message ?? raw.payload?.message ?? raw.message;

      if (!clientId || !payload) return;

      const peerId =
        payload.sender_id === authUserRef.current
          ? payload.recipient_id
          : payload.sender_id;

      // 1. Replace optimistic message in React Query
      queryClient.setQueryData(["messages", peerId], (old: any) =>
        replaceOptimisticMessage(old, clientId, {
          ...payload,
          peer_id: peerId,
          pending: false,
          delivery_status: "sent",
        }),
      );

      // 2. Fix DB: remove temp + store real
      const db = await getDB();
if (!db) return;

await db.messages.update(clientId, {
  ...payload,
  id: payload.id, // server id
  peer_id: peerId,
  pending: false,
  delivery_status: "sent",
});
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

    const handleUserOnline = (raw: any) => {
      const { user, online } = raw?.data;
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

    const handleReadUpdated = (raw: any) => {
      const { data } = raw;
      const { reader_id, message_id, read } = data;
      if (!reader_id || !message_id) return;

      if (read && reader_id !== authUserRef.current) {
        decrementUnread(reader_id);
      }

      if (!readQueue.current[reader_id]) readQueue.current[reader_id] = [];
      readQueue.current[reader_id].push({ message_id, read });

      if (flushRef.current) clearTimeout(flushRef.current);
      flushRef.current = setTimeout(() => {
        Object.entries(readQueue.current).forEach(([rid, updates]) => {
          queryClient.setQueriesData(
            { queryKey: ["messages", rid] },
            (old: any) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page: any) => ({
                  ...page,
                  messages: {
                    ...page.messages,
                    items: page.messages.items.map((msg: any) => {
                      const update = updates.find(
                        (u) => u.message_id === msg.id,
                      );
                      if (!update) return msg;
                      return {
                        ...msg,
                        read_at: update.read ? new Date().toISOString() : null,
                      };
                    }),
                  },
                })),
              };
            },
          );
        });
        readQueue.current = {};
      }, 50);
    };

    const handleOnlineSnapshot = (raw: any) => {
      const { data } = raw;
      const items = data?.items || [];
      const onlineMap: Record<string, boolean> = {};
      items.forEach((item: any) => {
        if (item?.user?.id && item.online) {
          onlineMap[item.user.id] = true;
        }
      });
      setOnlineUsersRef.current(() => onlineMap);
    };

    websocket.on("chat.message", handleMessage);
    websocket.on("chat.sent", handleMessageAck);
    websocket.on("chat.typing", handleTyping);
    websocket.on("user.online", handleUserOnline);
    websocket.on("user.online.snapshot", handleOnlineSnapshot);
    websocket.on("chat.read.updated", handleReadUpdated);
    websocket.on("chat.read.ack", handleReadUpdated);

    return () => {
      websocket.off("chat.message", handleMessage);
      websocket.off("chat.sent", handleMessageAck);
      websocket.off("chat.typing", handleTyping);
      websocket.off("user.online", handleUserOnline);
      websocket.off("user.online.snapshot", handleOnlineSnapshot);
      websocket.off("chat.read.updated", handleReadUpdated);
      websocket.off("chat.read.ack", handleReadUpdated);
    };
  }, [authUserId]);
};
