"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useChatUtils } from "@/app/context/ChatContext";
import ChatMessage from "./ChatMessage";
import ImageViewer from "./ImageViewer";
import { ReplyTarget, User } from "@/app/_utils/types/buyer";
import useChat from "@/app/hooks/use-chat";
import { useParams } from "next/navigation";
import { formatMessageDate } from "@/app/_utils/formatters";
import { useAuth } from "@/app/context/AuthContext";
import { websocket } from "@/app/services/websocket";
import TypingDots from "./TypingDots";
import ChatMediaMessage from "./ChatMediaMessage";
import SendMessage from "./SendMessage";

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
  const readSet = useRef<Set<string>>(new Set());
  const hasInitialScrollRef = useRef(false);
  const prevMessageCountRef = useRef(0);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Reply state — lifted here so both MessageList and SendMessage share it
  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);

  const flatMessages =
    messages?.pages?.flatMap((page: any) => page?.messages?.items || []) || [];

  const sortedMessages = [...flatMessages].sort(
    (a: any, b: any) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  const groupedMessages = useMemo(() => {
    const map: Record<string, any> = {};
    for (const msg of sortedMessages) {
      const label = formatMessageDate(msg.created_at);
      if (!map[label]) {
        map[label] = {
          label,
          timestamp: new Date(msg.created_at).getTime(),
          messages: [],
        };
      }
      map[label].messages.push(msg);
    }
    return Object.values(map).sort(
      (a: any, b: any) => a.timestamp - b.timestamp,
    );
  }, [sortedMessages]);

  const mediaMessages = useMemo(
    () =>
      sortedMessages
        .filter((m: any) => m.media_type && (m.media_url || m.local_url))
        .map((m: any) => ({
          src: m.media_url || m.local_url,
          id: m.id,
          created_at: m.created_at,
          sender: m.sender,
          sender_id: m.sender_id,
        })),
    [sortedMessages],
  );

  const mediaIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    mediaMessages.forEach((m: { id: string }, i: number) => map.set(m.id, i));
    return map;
  }, [mediaMessages]);

  const isTyping = typingUsers[chatId];

  const isMedia = (msg: any) =>
    (msg.media_type === "image" ||
      msg.media_type === "video" ||
      msg.media_type === "file") &&
    (msg.media_url || msg.local_url);

  useEffect(() => {
    if (!sortedMessages.length || hasInitialScrollRef.current) return;
    hasInitialScrollRef.current = true;
    requestAnimationFrame(() => {
      const el = containerRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [chatId, sortedMessages.length]);

  const isNearBottom = () => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 180;
  };

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const lastMessage = sortedMessages.at(-1);
    if (!lastMessage) return;
    const isMyMessage = lastMessage.sender_id === authDetails?.user?.id;
    const shouldScroll = isMyMessage || isNearBottom();
    requestAnimationFrame(() => {
      if (shouldScroll) el.scrollTop = el.scrollHeight;
    });
    prevMessageCountRef.current = sortedMessages.length;
  }, [sortedMessages.length]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollTop <= 100 && hasNextPage && !isFetchingNextPage)
      fetchNextPage();
  };

  useEffect(() => {
    if (!sortedMessages.length) return;
    const unread = sortedMessages.filter(
      (msg: any) =>
        msg.sender_id !== authDetails?.user?.id &&
        !msg.read_at &&
        !readSet.current.has(msg.id),
    );
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
    // Wrap in a flex column so SendMessage sits naturally below the scroll area
    <div className="flex flex-col flex-1 overflow-hidden">
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
                isMedia(msg) ? (
                  <ChatMediaMessage
                    key={msg.id}
                    msg={msg}
                    onReply={(m: any) =>
                      setReplyTo({
                        id: m.id,
                        body: m.body ?? m.caption ?? "",
                        sender_id: m.sender_id,
                        sender: m.sender,
                      })
                    }
                    onOpen={(id: string) => {
                      const index = mediaIndexMap.get(id);
                      if (index === undefined) return;
                      setViewerIndex(index);
                      setViewerOpen(true);
                    }}
                  />
                ) : (
                  <ChatMessage
                    key={msg.id}
                    msg={msg}
                    onReply={(m: any) =>
                      setReplyTo({
                        id: m.id,
                        body: m.body,
                        sender_id: m.sender_id,
                        sender: m.sender,
                      })
                    }
                  />
                ),
              )}
            </div>
          </div>
        ))}

        {isTyping && <TypingDots />}
        <div className="h-2" />

        {viewerOpen && (
          <ImageViewer
            media={mediaMessages}
            startIndex={viewerIndex}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </div>

      {/* SendMessage is rendered here so it receives replyTo state */}
      <SendMessage
        selectedChat={selectedChat}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
};

export default MessageList;
