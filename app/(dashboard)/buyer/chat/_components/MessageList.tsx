"use client";

import { useEffect, useRef, useState } from "react";
import { useChatUtils } from "@/app/context/ChatContext";
import { MessageSquareDashed } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatImageMessage from "./ChatImageMessage";
import ImageViewer from "./ImageViewer";
import { User } from "@/app/_utils/types/buyer";
import useChat from "@/app/hooks/use-chat";
import { useParams } from "next/navigation";
import { formatMessageDate } from "@/app/_utils/formatters";
import { useAuth } from "@/app/context/AuthContext";
import { websocket } from "@/app/services/websocket";

const MessageList = ({ selectedChat }: { selectedChat: User }) => {
  const { authDetails } = useAuth();
  const { chatId } = useParams<any>();
  const { useGetMessages } = useChat();
  const {
  data: messages,
  isLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useGetMessages({
  userId: chatId,
});

  const { typingUsers } = useChatUtils();
  const readSet = useRef<Set<string>>(new Set());

  //  Scroll container ref (KEY CHANGE)
  const containerRef = useRef<HTMLDivElement | null>(null);
const prevScrollHeightRef = useRef(0);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const prevMessageCountRef = useRef(0);
  const hasInitialScrollRef = useRef(false);

  const chatMessages =
    messages?.pages?.flatMap(
      (page: any) =>
        page?.messages?.items?.sort(
          (a: any, b: any) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        ) || [],
    ) || [];

  const groupedMessages = chatMessages.reduce((groups: any[], message: any) => {
    const label = formatMessageDate(message.created_at);

    const existingGroup = groups.find((g) => g.label === label);

    if (existingGroup) {
      existingGroup.messages.push(message);
    } else {
      groups.push({ label, messages: [message] });
    }

    return groups;
  }, []);

  const mediaImages =
    chatMessages
      ?.filter((m: any) => m.images?.length > 0)
      .flatMap((m: any) =>
        m.images.map((img: string) => ({
          src: img,
          messageId: m.id,
        })),
      ) || [];

  const isTyping = typingUsers[chatId];

  useEffect(() => {
    hasInitialScrollRef.current = false;
  }, [chatId]);

  const scrollToBottom = (smooth = true) => {
    const el = containerRef.current;
    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  };

const handleScroll = () => {
  const el = containerRef.current;
  if (!el) return;

  const nearTop = el.scrollTop <= 100;

  if (nearTop && hasNextPage && !isFetchingNextPage) {
    prevScrollHeightRef.current = el.scrollHeight;
    fetchNextPage();
  }
};

  const isUserNearBottom = () => {
    const el = containerRef.current;
    if (!el) return true;

    const threshold = 180; // px buffer
    return el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  };

  useEffect(() => {
    if (!chatMessages.length) return;

    // only once per chat load
    if (hasInitialScrollRef.current) return;

    hasInitialScrollRef.current = true;

    requestAnimationFrame(() => {
      scrollToBottom(false);
    });
  }, [chatMessages.length, chatId]);

  useEffect(() => {
    const prev = prevMessageCountRef.current;
    const current = chatMessages.length;

    const hasNewMessage = current > prev;

    if (hasNewMessage && isUserNearBottom()) {
      requestAnimationFrame(() => {
        scrollToBottom(true);
      });
    }

    prevMessageCountRef.current = current;
  }, [chatMessages.length]);

  useEffect(() => {
    if (isTyping && isUserNearBottom()) {
      scrollToBottom(true);
    }
  }, [isTyping]);

  useEffect(() => {
    if (!chatMessages.length) return;

    const unread = chatMessages.filter((msg: any) => {
      return (
        msg.sender_id !== authDetails?.user?.id &&
        !msg.read_at &&
        !readSet.current.has(msg.id)
      );
    });

    if (unread.length === 0) return;

    for (const msg of unread) {
      readSet.current.add(msg.id);

      websocket.emit("chat.read", {
        conversation_id: chatMessages[0]?.conversation_id,
        message_id: msg.id,
      });
    }
  }, [chatMessages.length, chatId]);


useEffect(() => {
  const el = containerRef.current;
  if (!el) return;

  if (!isFetchingNextPage) return;

  requestAnimationFrame(() => {
    const newScrollHeight = el.scrollHeight;
    const oldScrollHeight = prevScrollHeightRef.current;

    el.scrollTop = newScrollHeight - oldScrollHeight;
  });
}, [isFetchingNextPage, messages?.pages]);

  if (!selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="bg-[#F4F4F4] p-4 rounded-full mb-4">
          <MessageSquareDashed className="size-8 text-[#9C9C9C]" />
        </div>
        <h3 className="text-[13px] font-semibold text-black">Your Messages</h3>
        <p className="text-xs text-[#9C9C9C] max-w-62.5 mt-2">
          Select a conversation from the sidebar to start gisting.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`animate-pulse rounded-2xl px-4 py-3 ${
                i % 2 === 0 ? "bg-gray-200" : "bg-gray-100"
              }`}
              style={{
                width: `${Math.random() * 40 + 30}%`,
                height: "40px",
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (chatMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="bg-gray-100 p-4 rounded-full mb-3">
          <MessageSquareDashed className="size-6 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">No messages yet</p>
        <p className="text-xs text-gray-400 mt-1">Start the conversation 👋</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
  onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-6 pb-6 pt-2 space-y-6 bg-white"
    >
<div className="sticky top-0 z-10 flex justify-center">
  {isFetchingNextPage && (
    <div className="text-xs bg-white px-3 py-1 shadow rounded-full text-gray-500">
      Loading older messages...
    </div>
  )}
</div>
      {groupedMessages.map((group: any) => (
        <div key={group.label}>
          {/* Date separator */}
          <div className="sticky top-0 flex items-center justify-center my-6">
            <span className="text-[13px] text-black font-medium">
              {group.label}
            </span>
          </div>

          <div className="space-y-2">
            {group.messages.map((msg: any) =>
              msg.images?.length > 0 ? (
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

      {/* Typing indicator */}
      {isTyping && (
        <div className="text-sm text-gray-400 italic px-2">typing...</div>
      )}

      {/* IMPORTANT: bottom anchor not needed anymore */}
      <div className="h-1" />

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
