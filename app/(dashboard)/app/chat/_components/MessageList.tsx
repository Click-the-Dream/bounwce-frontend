"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useChatUtils } from "@/app/context/ChatContext";
import ChatMessage from "./ChatMessage";
import ChatImageMessage from "./ChatImageMessage";
import ImageViewer from "./ImageViewer";
import { User } from "@/app/_utils/types/buyer";
import useChat from "@/app/hooks/use-chat";
import { useParams } from "next/navigation";
import { formatMessageDate } from "@/app/_utils/formatters";
import { useAuth } from "@/app/context/AuthContext";
import { websocket } from "@/app/services/websocket";
import TypingDots from "./TypingDots";

interface ChatHeaderProps {
  selectedChat?: User;
  role?: "buyer" | "vendor";
}

const MessageList = ({ selectedChat, role = "buyer" }: ChatHeaderProps) => {
  const { authDetails } = useAuth();
  const { chatId } = useParams<any>();
  const { useGetMessages } = useChat();

  const {
    data: messages,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetMessages({ userId: chatId });

  const { typingUsers } = useChatUtils();

  const topAnchorRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef(0);
  const readSet = useRef<Set<string>>(new Set());

  const hasInitialScrollRef = useRef(false);
  const prevMessageCountRef = useRef(0);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const flatMessages =
    messages?.pages?.flatMap((page: any) => page?.messages?.items || []) || [];

  const sortedMessages = [...flatMessages].sort(
    (a: any, b: any) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const groupedMessages = Object.values(
    sortedMessages.reduce((acc: any, msg: any) => {
      const label = formatMessageDate(msg.created_at);

      if (!acc[label]) {
        acc[label] = {
          label,
          timestamp: new Date(msg.created_at).getTime(),
          messages: [],
        };
      }

      acc[label].messages.push(msg);

      return acc;
    }, {}),
  ).sort((a: any, b: any) => a.timestamp - b.timestamp);

  // MEDIA LIST
  const mediaImages = sortedMessages.flatMap((m: any) =>
    (m.images || []).map((img: string) => ({
      src: img,
      messageId: m.id,
    })),
  );

  const isTyping = typingUsers[chatId];

  // INITIAL SCROLL
  useEffect(() => {
    if (!sortedMessages.length) return;
    if (hasInitialScrollRef.current) return;

    hasInitialScrollRef.current = true;

    requestAnimationFrame(() => {
      const el = containerRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  }, [chatId, sortedMessages.length]);

  // AUTO SCROLL ON NEW MESSAGE
  const isNearBottom = () => {
    const el = containerRef.current;
    if (!el) return true;

    return el.scrollHeight - el.scrollTop - el.clientHeight < 180;
  };

  useEffect(() => {
    const prev = prevMessageCountRef.current;
    const current = sortedMessages.length;

    if (current > prev && isNearBottom()) {
      requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
      });
    }

    prevMessageCountRef.current = current;
  }, [sortedMessages.length]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    if (el.scrollTop <= 100 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // MARK AS READ
  useEffect(() => {
    if (!sortedMessages.length) return;

    const unread = sortedMessages.filter((msg: any) => {
      return (
        msg.sender_id !== authDetails?.user?.id &&
        !msg.read_at &&
        !readSet.current.has(msg.id)
      );
    });

    for (const msg of unread) {
      readSet.current.add(msg.id);

      websocket.emit("chat.read", {
        conversation_id: sortedMessages[0]?.conversation_id,
        message_id: msg.id,
      });
    }
  }, [sortedMessages.length, chatId]);

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 ? "justify-start" : "justify-end"}`}
          >
            <div className="animate-pulse bg-gray-200 rounded-2xl w-1/2 h-10" />
          </div>
        ))}
      </div>
    );
  }

  if (!sortedMessages.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        No messages yet
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-6 pb-6 pt-2 space-y-6 bg-white"
    >
      <div ref={topAnchorRef} />
      {isFetchingNextPage && (
        <div className="text-center text-xs text-gray-400">
          Loading older messages...
        </div>
      )}
      {groupedMessages.map((group: any) => (
        <div key={group.label}>
          <div className="sticky top-0 z-10 flex justify-center my-4 text-xs text-gray-500">
            {group.label}
          </div>

          <div className="space-y-2">
            {group.messages.map((msg: any) =>
              msg.images?.length ? (
                <ChatImageMessage
                  key={msg.id}
                  msg={msg}
                  mediaImages={mediaImages}
                  onOpen={(index: number) => {
                    setViewerIndex(index);
                    setViewerOpen(true);
                  }}
                />
              ) : (
                <ChatMessage key={msg.id} msg={msg} />
              ),
            )}
          </div>
        </div>
      ))}

      {isTyping && <TypingDots />}

      <div className="h-2" />

      {viewerOpen && (
        <ImageViewer
          media={mediaImages}
          startIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          user={selectedChat}
        />
      )}
    </div>
  );
};

export default MessageList;
