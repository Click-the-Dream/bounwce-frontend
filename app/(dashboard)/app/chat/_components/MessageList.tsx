"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { useChatUtils } from "@/app/context/ChatContext";
import { useAuth } from "@/app/context/AuthContext";
import { websocket } from "@/app/services/websocket";
import useChat from "@/app/hooks/use-chat";
import { formatMessageDate } from "@/app/_utils/formatters";

import ChatMessage from "./ChatMessage";
import ChatMediaMessage from "./ChatMediaMessage";
import ImageViewer from "./ImageViewer";
import TypingDots from "./TypingDots";

// TYPES

interface FlatMessage {
  id: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  body?: string;
  caption?: string;
  read_at?: string | null;
  media_type?: string;
  media_urls?: string[];
  local_urls?: string[];
  [key: string]: any;
}

// CONSTANTS

const SCROLL_THRESHOLD = 180; // px from bottom — auto-scroll on new message
const LOAD_MORE_THRESHOLD = 150; // px from top — load older messages

const isMediaMessage = (msg: FlatMessage) =>
  (msg.media_type === "image" ||
    msg.media_type === "video" ||
    msg.media_type === "file") &&
  (msg.media_urls || msg.local_urls);

// COMPONENT

const MessageList = () => {
  const { authDetails } = useAuth();
  const { setReplyTo, typingUsers, activeUploadsRef } = useChatUtils();
  const { chatId } = useParams<{ chatId: string }>();

  const {
    useGetMessages,
    useGetChatSignature,
    retryEmitMedia,
    uploadAndEmitMedia,
  } = useChat();

  // ─── DATA ───────────────────────────────────

  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useGetMessages({ userId: chatId });

  // ─── REFS ───────────────────────────────────

  const containerRef = useRef<HTMLDivElement | null>(null);
  const readSet = useRef<Set<string>>(new Set());
  const hasScrolledInitiallyRef = useRef(false);
  const prevScrollHeightRef = useRef(0);
  const prevScrollTopRef = useRef(0);
  const loadingOlderRef = useRef(false);

  // ─── STATE ──────────────────────────────────

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // ─── DERIVED DATA ───────────────────────────

  const flatMessages: FlatMessage[] =
    messagesData?.pages?.flatMap((page: any) => page?.messages?.items || []) ||
    [];

  // Deduplicate — cache + server pages can overlap
  const deduped = useMemo(() => {
    const seen = new Set<string>();
    return flatMessages.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [flatMessages]);

  const sortedMessages = useMemo(
    () =>
      [...deduped].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      ),
    [deduped],
  );

  // Group by date for section headers
  const groupedMessages = useMemo(() => {
    const map: Record<
      string,
      { label: string; timestamp: number; messages: FlatMessage[] }
    > = {};

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

    return Object.values(map).sort((a, b) => a.timestamp - b.timestamp);
  }, [sortedMessages]);

  // Flat image list for lightbox
  const mediaMessages = useMemo(() => {
    const flattened: any[] = [];
    for (const m of sortedMessages) {
      if (m.media_type === "image" && Array.isArray(m.media_urls)) {
        m.media_urls.forEach((url: string, index: number) => {
          flattened.push({
            src: url,
            id: `${m.id}-${index}`,
            parent_id: m.id,
            created_at: m.created_at,
            sender: m.sender,
            sender_id: m.sender_id,
          });
        });
      }
    }
    return flattened;
  }, [sortedMessages]);

  const mediaIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    mediaMessages.forEach((m, i) => map.set(m.src, i));
    return map;
  }, [mediaMessages]);

  const isTyping = typingUsers[chatId];

  // ─── SCROLL HELPERS ─────────────────────────

  const isNearBottom = () => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_THRESHOLD;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  /**
   * Finds a message element by its data-message-id, scrolls to it,
   * and fires a highlight event so the target message flashes.
   * Used when clicking a reply preview inside a message bubble.
   */
  const scrollToMessage = (messageId: string) => {
    const el = containerRef.current;
    if (!el) return;

    const target = el.querySelector(
      `[data-message-id="${messageId}"]`,
    ) as HTMLElement | null;

    if (!target) return; // Message not yet in DOM (paginated away)

    target.scrollIntoView({ behavior: "smooth", block: "center" });

    window.dispatchEvent(
      new CustomEvent("highlight-message", { detail: { messageId } }),
    );
  };

  // ─── EFFECTS: SCROLL ────────────────────────
  useLayoutEffect(() => {
    if (!loadingOlderRef.current) return;

    const el = containerRef.current;
    if (!el) return;

    const newScrollHeight = el.scrollHeight;
    const diff = newScrollHeight - prevScrollHeightRef.current;

    el.scrollTop = prevScrollTopRef.current + diff;

    loadingOlderRef.current = false;
  }, [messagesData?.pages]);

  // Initial scroll to bottom on first load for this chat
  useLayoutEffect(() => {
    const el = containerRef.current;

    if (!el) return;
    if (!sortedMessages.length) return;
    if (hasScrolledInitiallyRef.current) return;

    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;

      hasScrolledInitiallyRef.current = true;
    });
  }, [sortedMessages.length, chatId]);

  // Reset when switching chats
  useEffect(() => {
    hasScrolledInitiallyRef.current = false;
    readSet.current = new Set();
  }, [chatId]);

  // Auto-scroll on new messages when near bottom or own send
  useLayoutEffect(() => {
    if (!hasScrolledInitiallyRef.current) return;

    const lastMessage = sortedMessages.at(-1);
    if (!lastMessage) return;

    const isMyMessage = lastMessage.sender_id === authDetails?.user?.id;

    if (isMyMessage || isNearBottom()) {
      requestAnimationFrame(() => scrollToBottom("smooth"));
    }
  }, [sortedMessages.length]);

  // Proactively load more if content doesn't fill the container
  useEffect(() => {
    const el = containerRef.current;

    if (!el) return;

    if (
      hasScrolledInitiallyRef.current &&
      el.scrollHeight <= el.clientHeight &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [messagesData?.pages?.length]);

  // ─── EFFECTS: MARK AS READ ──────────────────

  useEffect(() => {
    if (!sortedMessages.length) return;

    const unread = sortedMessages.filter(
      (msg) =>
        msg.sender_id !== authDetails?.user?.id &&
        !msg.read_at &&
        !readSet.current.has(msg.id),
    );

    for (const msg of unread) {
      readSet.current.add(msg.id);
      websocket.emit("chat.read", {
        recipient_id: sortedMessages[0]?.conversation_id,
        message_id: msg.id,
      });
    }
  }, [sortedMessages.length, chatId]);

  // ─── HANDLERS ───────────────────────────────

  const handleScroll = async () => {
    const el = containerRef.current;

    if (!el || !hasNextPage || isFetchingNextPage) return;

    if (el.scrollTop <= LOAD_MORE_THRESHOLD) {
      loadingOlderRef.current = true;

      prevScrollHeightRef.current = el.scrollHeight;
      prevScrollTopRef.current = el.scrollTop;

      await fetchNextPage();
    }
  };

  const handleSetReply = (m: FlatMessage) =>
    setReplyTo({
      id: m.id,
      body: m.body ?? m.caption ?? "",
      media_type: m.media_type,
      media_url: m.media_url,
      sender_id: m.sender_id,
      sender: m.sender,
    });

  const handleOpenImage = (url: string) => {
    const index = mediaIndexMap.get(url);
    if (index === undefined) return;
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const handleRetry = async (msg: FlatMessage) => {
    const isAlreadyUploaded =
      msg.media_urls?.[0] && !msg.media_urls[0].startsWith("blob:");

    if (isAlreadyUploaded) {
      retryEmitMedia({
        recipient_id: chatId,
        media_urls: msg.media_urls!,
        caption: msg.body || msg.caption || "",
        clientId: [msg.id],
        reply_to: msg.reply_to,
      });
      return;
    }

    const files = activeUploadsRef.current.get(msg.id);
    if (!files) {
      console.error(
        "Original files not found in activeUploadsRef for:",
        msg.id,
      );
      return;
    }

    try {
      const getSignature = useGetChatSignature();
      const raw = await getSignature.mutateAsync({
        uploadType: msg.media_type!,
        count: files.length,
      });

      const signatureItems = (raw.items || [raw.fields]).map((item: any) => ({
        fields: item,
        constraints: raw.constraints,
      }));

      await uploadAndEmitMedia({
        files,
        recipient_id: chatId,
        type: msg.media_type as "image" | "video" | "file",
        caption: msg.body || msg.caption || "",
        signatures: signatureItems,
        clientId: [msg.id],
        reply_to: msg.reply_to,
      });
    } catch (err) {
      console.error("Retry upload failed:", err);
    }
  };

  // ─── RENDER STATES ──────────────────────────

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
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        No messages yet
      </div>
    );
  }

  // ─── MAIN RENDER ────────────────────────────

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 pb-6 pt-2 space-y-6 bg-white"
      >
        {/* Load older messages indicator */}
        {isFetchingNextPage && (
          <div className="text-center text-xs text-gray-400 py-2">
            Loading older messages…
          </div>
        )}

        {/* Date-grouped messages */}
        {groupedMessages.map((group) => (
          <div key={group.label}>
            {/* Date header */}
            <div className="sticky top-0 z-10 flex justify-center my-4">
              <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full">
                {group.label}
              </span>
            </div>

            {/* Messages */}
            <div className="space-y-2">
              {group.messages.map((msg) =>
                isMediaMessage(msg) ? (
                  <ChatMediaMessage
                    key={`${msg.id}-${msg.created_at}`}
                    msg={msg}
                    onReply={() => handleSetReply(msg)}
                    onOpen={handleOpenImage}
                    onRetry={() => handleRetry(msg)}
                    onScrollToMessage={scrollToMessage}
                  />
                ) : (
                  <ChatMessage
                    key={`${msg.id}-${msg.created_at}`}
                    msg={msg}
                    onReply={() => handleSetReply(msg)}
                    onScrollToMessage={scrollToMessage}
                  />
                ),
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && <TypingDots />}

        {/* Bottom spacer */}
        <div className="h-2" />
      </div>

      {/* Lightbox — outside scroll container to avoid clipping */}
      {viewerOpen && (
        <ImageViewer
          media={mediaMessages}
          startIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
};

export default MessageList;
