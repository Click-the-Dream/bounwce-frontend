"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { websocket } from "../services/websocket";
import { useNotifications } from "../context/NotificationContext";
import { onMessageToast } from "../_utils/message-toast";
import { useChatUtils } from "../context/ChatContext";
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
  const { setTypingUsers, setOnlineUsers } = useChatUtils();

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

  // Handle active conversation read state sync
  useEffect(() => {
    activeChatRef.current = activeConversationId;
    if (!activeConversationId) return;

    queryClient.setQueriesData({ queryKey: ["conversations"] }, (old: any) => {
      if (!old?.pages) return old;
      return {
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          items: page.items?.map((c: any) =>
            c.user?.id === activeConversationId ? { ...c, unread_count: 0 } : c,
          ),
        })),
      };
    });
  }, [activeConversationId, queryClient]);

  useEffect(() => {
    return () => {
      if (flushRef.current) clearTimeout(flushRef.current);
    };
  }, []);

  useEffect(() => {
    const handleMessage = (raw: any) => {
      const payload = raw.data ?? raw.payload ?? raw;
      const incoming = payload.message ?? payload;
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
      const isActiveChat =
        !!activeChatRef.current && otherUserId === activeChatRef.current;

      // Update Messages Cache
      queryClient.setQueryData(["messages", otherUserId], (old: any) => {
        if (!old?.pages) return old;
        const pages = old.pages.map((page: any) => {
          const items = page.messages?.items ?? [];
          const exists = items.some((i: any) => i.id === message.id);
          return {
            ...page,
            messages: {
              ...page.messages,
              items: exists
                ? items.map((i: any) => (i.id === message.id ? message : i))
                : [...items, message],
            },
          };
        });
        return { ...old, pages };
      });

      // Update Conversations Cache
      queryClient.setQueriesData(
        { queryKey: ["conversations"] },
        (old: any) => {
          if (!old?.pages) return old;
          let updatedConv: any = null;
          const newPages = old.pages.map((page: any) => {
            const filtered = (page.items ?? []).filter((c: any) => {
              const isMatch = c.user?.id === otherUserId;
              if (isMatch) {
                updatedConv = {
                  ...c,
                  last_message: {
                    ...c.last_message,
                    body: message.body,
                    sender_id: message.sender_id,
                  },
                  updated_at: message.updated_at || new Date().toISOString(),
                  unread_count: isActiveChat
                    ? 0
                    : !isMyMessage
                      ? (c.unread_count || 0) + 1
                      : c.unread_count,
                };
                return false;
              }
              return true;
            });
            return { ...page, items: filtered };
          });
          if (updatedConv) newPages[0].items.unshift(updatedConv);
          return { ...old, pages: newPages };
        },
      );

      if (!isMyMessage && !isActiveChat) {
        pushNotification({
          id: crypto.randomUUID(),
          title: message.sender?.full_name || "New Message",
          body: message.body,
          event_type: "chat_message",
          payload: {
            route: "chat.conversation",
            sender: message.sender,
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

    const handleSentAck = (raw: any) => {
      const clientId = raw.data?.client_id || raw.client_id;
      const peerId = raw.data?.recipient_id;

      if (!clientId || !peerId) return;

      queryClient.setQueryData(["messages", peerId], (old: any) =>
        replaceOptimisticMessage(old, clientId, {
          pending: false,
          delivery_status: "sent",
        }),
      );

      queryClient.setQueriesData(
        { queryKey: ["conversations"] },
        (old: any) => {
          if (!old?.pages) return old;
          let updatedConv: any = null;
          const newPages = old.pages.map((page: any) => {
            const filtered = (page.items ?? []).filter((c: any) => {
              if (c.user?.id === peerId) {
                updatedConv = {
                  ...c,
                  last_message: {
                    ...c.last_message,
                    body: "New Message",
                  },
                };
                return false;
              }
              return true;
            });
            return { ...page, items: filtered };
          });
          if (updatedConv) newPages[0].items.unshift(updatedConv);
          return { ...old, pages: newPages };
        },
      );
    };

    const handleDeliveredAck = (raw: any) => {
      const clientId = raw.client_id;
      const payload = raw.data?.message ?? raw.payload?.message ?? raw.message;
      if (!clientId || !payload) return;

      const peerId =
        payload.sender_id === authUserRef.current
          ? payload.recipient_id
          : payload.sender_id;
      queryClient.setQueryData(["messages", peerId], (old: any) =>
        replaceOptimisticMessage(old, clientId, {
          ...payload,
          peer_id: peerId,
          pending: false,
          delivery_status: "delivered",
        }),
      );

      queryClient.setQueriesData(
        { queryKey: ["conversations"] },
        (old: any) => {
          if (!old?.pages) return old;
          let updatedConv: any = null;
          const newPages = old.pages.map((page: any) => {
            const filtered = (page.items ?? []).filter((c: any) => {
              if (c.user?.id === peerId) {
                updatedConv = {
                  ...c,
                  last_message: { ...c.last_message, ...payload },
                  updated_at: payload.updated_at,
                };
                return false;
              }
              return true;
            });
            return { ...page, items: filtered };
          });
          if (updatedConv) newPages[0].items.unshift(updatedConv);
          return { ...old, pages: newPages };
        },
      );
    };

    const handleTyping = (raw: any) => {
      const data = raw.data || raw;
      if (data?.user?.id)
        setTypingUsersRef.current((prev: any) => ({
          ...prev,
          [data.user.id]: data.is_typing,
        }));
    };

    const handleUserOnline = (raw: any) => {
      const { user, online } = raw?.data || {};
      if (user?.id) {
        setOnlineUsersRef.current((prev: any) => {
          const next = { ...prev };
          online ? (next[user.id] = true) : delete next[user.id];
          return next;
        });
      }
    };

    const handleReadUpdated = (raw: any) => {
      const { data } = raw;
      if (!data?.reader_id || !data?.message_id) return;
      if (data.read && data.reader_id !== authUserRef.current)
        decrementUnread(data.reader_id);

      if (!readQueue.current[data.reader_id])
        readQueue.current[data.reader_id] = [];
      readQueue.current[data.reader_id].push({
        message_id: data.message_id,
        read: data.read,
      });

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
                      return update
                        ? {
                            ...msg,
                            read_at: update.read
                              ? new Date().toISOString()
                              : null,
                          }
                        : msg;
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
      const items = raw.data?.items || [];
      const onlineMap: Record<string, boolean> = {};
      items.forEach((item: any) => {
        if (item?.user?.id && item.online) onlineMap[item.user.id] = true;
      });
      setOnlineUsersRef.current(() => onlineMap);
    };

    websocket.on("chat.message", handleMessage);
    websocket.on("chat.sent", handleDeliveredAck);
    websocket.on("chat.send.ack", handleSentAck);
    websocket.on("chat.typing", handleTyping);
    websocket.on("user.online", handleUserOnline);
    websocket.on("user.online.snapshot", handleOnlineSnapshot);
    websocket.on("chat.read.updated", handleReadUpdated);
    websocket.on("chat.read.ack", handleReadUpdated);

    return () => {
      websocket.off("chat.message", handleMessage);
      websocket.off("chat.sent", handleDeliveredAck);
      websocket.off("chat.send.ack", handleSentAck);
      websocket.off("chat.typing", handleTyping);
      websocket.off("user.online", handleUserOnline);
      websocket.off("user.online.snapshot", handleOnlineSnapshot);
      websocket.off("chat.read.updated", handleReadUpdated);
      websocket.off("chat.read.ack", handleReadUpdated);
    };
  }, [queryClient, decrementUnread, pushNotification]);
};
