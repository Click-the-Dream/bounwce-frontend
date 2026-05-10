"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { websocket } from "@/app/services/websocket";

export const useSocketConnection = ({
  token,
  authUserId,
  setTypingUsers,
}: {
  token: string;
  authUserId: string;
  setTypingUsers: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    // CONNECT ONLY ONCE
    websocket.connect(token);

    // INCOMING / OUTGOING MESSAGE
    const handleMessage = (message: any) => {
      const otherUserId =
        message.sender_id === authUserId
          ? message.recipient_id
          : message.sender_id;

      queryClient.setQueryData(["messages", otherUserId], (old: any) => {
        if (!old) {
          return {
            pages: [
              {
                messages: {
                  items: [message],
                  page: 1,
                  total: 1,
                  page_size: 20,
                },
              },
            ],
            pageParams: [1],
          };
        }

        const updatedPages = [...old.pages];

        const items = updatedPages[0].messages.items;

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

        updatedPages[0] = {
          ...updatedPages[0],
          messages: {
            ...updatedPages[0].messages,
            items: [...filtered, message],
          },
        };

        return {
          ...old,
          pages: updatedPages,
        };
      });

      // update conversation list (last message preview)
      queryClient.setQueryData(["conversations"], (old: any) => {
        if (!old) return old;

        const updatedPages = old.pages.map((page: any) => {
          const items = page.items.map((c: any) =>
            c.id === message.recipient_id
              ? {
                  ...c,
                  last_message: message.body,
                  last_message_at: message.created_at,
                }
              : c,
          );

          return { ...page, items };
        });

        return { ...old, pages: updatedPages };
      });
    };

    const handleTyping = (payload: any) => {
      const { recipient_id } = payload;

      setTypingUsers((prev) => ({
        ...prev,
        [recipient_id]: true,
      }));
      setTimeout(() => {
        setTypingUsers((prev) => ({
          ...prev,
          [recipient_id]: false,
        }));
      }, 3000);
    };

    // READ RECEIPTS

    const handleReadAck = (data: any) => {
      const { recipient_id, message_id } = data;

      queryClient.setQueryData(["messages", recipient_id], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            messages: {
              ...page.messages,
              items: page.messages.items.map((msg: any) => {
                if (msg.id === message_id) {
                  return {
                    ...msg,
                    read_at: new Date().toISOString(),
                    status: "read",
                  };
                }
                return msg;
              }),
            },
          })),
        };
      });
    };

    websocket.on("chat.message", handleMessage);

    websocket.on("chat.sent", handleMessage);
    websocket.on("chat.typing", handleTyping);

    websocket.on("chat.read.ack", handleReadAck);

    // RECONNECT WHEN INTERNET RETURNS

    const handleOnline = () => {
      websocket.connect(token);
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);

      websocket.off("chat.message", handleMessage);
      websocket.off("chat.sent", handleMessage);
      websocket.off("chat.read.ack", handleReadAck);
      websocket.off("chat.typing", handleTyping);

      // DO NOT disconnect here
      // unless logout
    };
  }, [token, queryClient]);
};
