"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { websocket } from "../services/websocket";
import { useNotifications } from "../context/NotificationContext";
import { onMessageToast } from "../_utils/message-toast";
import { useChatUtils } from "../context/ChatContext";
import { syncEntity } from "../helpers/db-sync";
import { useAuth } from "../context/AuthContext";

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

  // FIX: Reset unread when navigating into a chat. Uses the same
  // ["conversations", {}] key that useGetConversations registers.
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
        updater: (c: any) => ({ ...c, unread_count: 0 }),
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
      const incoming = raw.message || raw;
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
      const isActiveChat =
        !!activeChatId &&
        (message.sender_id === activeChatId ||
          message.recipient_id === activeChatId);

      // ---------------- MESSAGES CACHE ----------------
      const db = await getDB();
      await syncEntity({
        db,
        queryClient,
        store: "messages",
        key: "id",
        keyValue: message.id,
        queryKey: ["messages", otherUserId],
        selector: (old: any, updater: any) => {
          if (!old) {
            return {
              pages: [
                {
                  messages: {
                    items: [updater(message)],
                    page: 1,
                    total: 1,
                    page_size: 20,
                  },
                },
              ],
              pageParams: [1],
            };
          }

          const pages = [...old.pages];
          const firstPage = pages[0];
          const items = firstPage?.messages?.items || [];

          // Remove optimistic duplicate
          let filtered = items.filter(
            (m: any) =>
              !(
                m.pending &&
                m.body === message.body &&
                m.sender_id === message.sender_id
              ),
          );

          // Replace optimistic client_id version
          if (message.client_id) {
            const index = filtered.findIndex(
              (m: any) => m.client_id === message.client_id,
            );
            if (index !== -1) {
              filtered[index] = updater(filtered[index]);
              pages[0] = {
                ...firstPage,
                messages: { ...firstPage.messages, items: filtered },
              };
              return { ...old, pages };
            }
          }

          // Dedupe real message
          const exists = filtered.some((m: any) => m.id === message.id);
          if (!exists) {
            filtered.push(updater(message));
          }

          pages[0] = {
            ...firstPage,
            messages: { ...firstPage.messages, items: filtered },
          };
          return { ...old, pages };
        },
        updater: (m: any) => ({
          ...m,
          ...message,
          pending: false,
          delivery_status: "sent",
        }),
      });

      // ---------------- CONVERSATIONS ----------------
      // FIX: Use ["conversations", {}] to match useGetConversations' query key.
      // FIX: Match by peer_id OR user?.id (not user_id which may not exist).
      // FIX: Bump the conversation to the top of the list on new message.

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

          // Bubble the updated conversation to the top of page 0
          // so the list always shows the most recent message first
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
        updater: (c: any) => ({
          ...c,
          last_message: {
            body: message.body,
            caption: message.caption,
            created_at: message.created_at || new Date().toISOString(),
            updated_at: message.updated_at || new Date().toISOString(),
            media_type: message.media_type,
            media_url: message.media_url,
            sender_id: message.sender_id,
          },
          updated_at: new Date().toISOString(),
          unread_count: isActiveChat
            ? 0
            : !isMyMessage
              ? (c.unread_count || 0) + 1
              : c.unread_count,
        }),
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

    websocket.off("chat.message", handleMessage);
    websocket.off("chat.sent", handleMessage);
    websocket.off("chat.typing", handleTyping);
    websocket.off("user.online", handleUserOnline);
    websocket.off("user.online.snapshot", handleOnlineSnapshot);
    websocket.off("chat.read.updated", handleReadUpdated);
    websocket.off("chat.read.ack", handleReadUpdated);

    websocket.on("chat.message", handleMessage);
    websocket.on("chat.sent", handleMessage);
    websocket.on("chat.typing", handleTyping);
    websocket.on("user.online", handleUserOnline);
    websocket.on("user.online.snapshot", handleOnlineSnapshot);
    websocket.on("chat.read.updated", handleReadUpdated);
    websocket.on("chat.read.ack", handleReadUpdated);

    return () => {
      websocket.off("chat.message", handleMessage);
      websocket.off("chat.sent", handleMessage);
      websocket.off("chat.typing", handleTyping);
      websocket.off("user.online", handleUserOnline);
      websocket.off("user.online.snapshot", handleOnlineSnapshot);
      websocket.off("chat.read.updated", handleReadUpdated);
      websocket.off("chat.read.ack", handleReadUpdated);
    };
  }, [authUserId]);
};
