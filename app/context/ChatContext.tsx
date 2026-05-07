"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { websocket } from "@/app/services/websocket";

export const ChatContext = createContext<any>({});

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});

  const queryClient = useQueryClient();

  useEffect(() => {
    // =====================
    // NEW MESSAGE
    // =====================
    websocket.on("chat.message", (payload: any) => {
      const { conversation_id, message } = payload;

      queryClient.setQueryData(["messages", conversation_id], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any, i: number) =>
            i === 0
              ? {
                  ...page,
                  items: [...page.items, message],
                }
              : page,
          ),
        };
      });
    });

    // =====================
    // DELIVERY UPDATE
    // =====================
    websocket.on("chat.message.sent", (payload: any) => {
      const { conversation_id, message } = payload;

      queryClient.setQueryData(["messages", conversation_id], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((msg: any) =>
              msg.temp_id === message.temp_id
                ? { ...message, status: "delivered" }
                : msg,
            ),
          })),
        };
      });
    });

    // =====================
    // TYPING
    // =====================
    websocket.on("typing.started", ({ conversation_id }: any) => {
      setTypingUsers((prev) => ({
        ...prev,
        [conversation_id]: true,
      }));
    });

    websocket.on("typing.stopped", ({ conversation_id }: any) => {
      setTypingUsers((prev) => ({
        ...prev,
        [conversation_id]: false,
      }));
    });

    return () => {
      websocket.off("chat.message", () => {});
      websocket.off("chat.message.sent", () => {});
      websocket.off("typing.started", () => {});
      websocket.off("typing.stopped", () => {});
    };
  }, [queryClient]);

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        typingUsers,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatUtils = () => useContext(ChatContext);
