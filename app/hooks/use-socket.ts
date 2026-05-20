"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { websocket } from "../services/websocket";
import { useNotifications } from "../context/NotificationContext";
import { onMessageToast } from "../_utils/message-toast";
import { getChatDB } from "../store/chat-store";

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
  const queryClient = useQueryClient();
  const chatDB = getChatDB(authUserId);
  const typingTimeouts = new Map<string, NodeJS.Timeout>();

  const { pushNotification, incrementUnread, decrementUnread } =
    useNotifications();

  const connectedRef = useRef(false);

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
    if (!token || !authUserId) return;

    if (!connectedRef.current) {
      websocket.connect(token);
      connectedRef.current = true;
    }

    const handleMessage = async (raw: any) => {
      // normalize payload
      const message = raw.message || raw;
      const otherUserId =
        message.sender_id === authUserId
          ? message.recipient_id
          : message.sender_id;
      const conversationId = message.conversation_id;

      const isMyMessage =
        String(message.sender_id) === String(authUserRef.current);

      console.log("New message", message, isMyMessage);

      //  ALWAYS USE LATEST ACTIVE CHAT
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

        return {
          ...old,
          pages,
        };
      });

      await chatDB.messages.put({
        ...message,
        conversation_id: otherUserId,
        synced: true,
      });

      // ---------------- CONVERSATIONS ----------------

      await chatDB.conversations.update(conversationId, {
        last_message: message,
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

          // update last message
          const updated = {
            ...conversation,
            last_message: {
              body: message.body,
              created_at: message?.created_at,
              updated_at: message?.updated_at,
            },
          };

          // remove from old position
          items.splice(index, 1);

          // move to top
          items.unshift(updated);

          return {
            ...page,
            items,
          };
        });

        return {
          ...old,
          pages,
        };
      });

      // ---------------- NOTIFICATIONS ----------------

      // no notification if currently inside chat
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
        });

        incrementUnread(otherUserId);
      }
    };

    const handleTyping = (raw: any) => {
      const data = raw.data || raw;

      const userId = data?.user?.id;

      if (!userId) return;

      setTypingUsers((prev) => ({
        ...prev,
        [userId]: data.is_typing,
      }));
    };

    const handleUserOnline = ({ user, online }: any) => {
      if (!user?.id) return;

      setOnlineUsers((prev) => {
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

      setOnlineUsers(onlineMap);
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
  }, [token, authUserId]);
};
