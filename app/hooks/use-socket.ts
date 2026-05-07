"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { websocket } from "@/app/services/websocket";

export const useSocketConnection = ({ token }: { token: string }) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;

    // CONNECT ONLY ONCE
    websocket.connect(token);

    // =========================
    // INCOMING / OUTGOING MESSAGE
    // =========================
    const handleMessage = (message: any) => {
      // =========================
      // UPDATE MESSAGE CACHE
      // =========================

      queryClient.setQueryData(
        ["messages", message.conversation_id],
        (old: any) => {
          if (!old) return old;

          // avoid duplicates
          const exists = old.pages?.some((page: any) =>
            page?.messages?.items?.some((m: any) => m.id === message.id),
          );

          if (exists) return old;

          const updatedPages = [...old.pages];

          updatedPages[0] = {
            ...updatedPages[0],

            messages: {
              ...updatedPages[0].messages,

              items: [...updatedPages[0].messages.items, message],
            },
          };

          return {
            ...old,
            pages: updatedPages,
          };
        },
      );

      // =========================
      // UPDATE CONVERSATION CACHE
      // =========================

      queryClient.setQueriesData(
        {
          queryKey: ["conversations"],
        },
        (old: any) => {
          if (!old) return old;

          const updatedPages = old.pages.map((page: any) => {
            const existing = page.items.find(
              (c: any) => c.id === message.conversation_id,
            );

            if (!existing) return page;

            const updatedItems = page.items.map((conversation: any) => {
              if (conversation.id !== message.conversation_id) {
                return conversation;
              }

              return {
                ...conversation,
                last_message_at: message.created_at,
                last_message: message.body,
              };
            });

            // move updated conversation to top
            const currentConversation = updatedItems.find(
              (c: any) => c.id === message.conversation_id,
            );

            const remaining = updatedItems.filter(
              (c: any) => c.id !== message.conversation_id,
            );

            return {
              ...page,
              items: [currentConversation, ...remaining],
            };
          });

          return {
            ...old,
            pages: updatedPages,
          };
        },
      );
    };

    // =========================
    // READ RECEIPTS
    // =========================

    const handleReadAck = (data: any) => {
      queryClient.setQueryData(
        ["messages", data.conversation_id],
        (old: any) => {
          if (!old) return old;

          const updatedPages = old.pages.map((page: any) => ({
            ...page,

            messages: {
              ...page.messages,

              items: page.messages.items.map((message: any) => {
                if (message.id === data.message_id) {
                  return {
                    ...message,
                    read_at: new Date().toISOString(),
                  };
                }

                return message;
              }),
            },
          }));

          return {
            ...old,
            pages: updatedPages,
          };
        },
      );
    };

    websocket.on("chat.message", handleMessage);

    websocket.on("chat.sent", handleMessage);

    websocket.on("chat.read.ack", handleReadAck);

    // =========================
    // RECONNECT WHEN INTERNET RETURNS
    // =========================

    const handleOnline = () => {
      websocket.connect(token);
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);

      websocket.off("chat.message", handleMessage);

      websocket.off("chat.sent", handleMessage);

      websocket.off("chat.read.ack", handleReadAck);

      // DO NOT disconnect here
      // unless logout
    };
  }, [token, queryClient]);
};
