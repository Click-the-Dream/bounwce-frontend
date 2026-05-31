"use client";

import {
  useImperativeHandle,
  forwardRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { syncMessageRead } from "@/app/helpers/db-sync";
import { useQueryClient } from "@tanstack/react-query";

// TYPES
interface Props {
  onScrollNearBottomChange?: (isNearBottom: boolean) => void;
  onUnreadChange?: (count: number) => void;
}
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

const SCROLL_THRESHOLD = 180;
const LOAD_MORE_THRESHOLD = 60;

const isMediaMessage = (msg: FlatMessage) =>
  (msg.media_type === "image" ||
    msg.media_type === "video" ||
    msg.media_type === "file") &&
  (msg.media_urls || msg.local_urls);

// COMPONENT

const MessageList = forwardRef(
  ({ onScrollNearBottomChange, onUnreadChange }: Props, ref) => {
    const queryClient = useQueryClient();
    const { authDetails } = useAuth();
    const { setReplyTo, typingUsers, activeUploadsRef, chatDBRef } =
      useChatUtils();
    const { chatId } = useParams<{ chatId: string }>();
    const {
      useGetMessages,
      useGetChatSignature,
      retryEmitMedia,
      uploadAndEmitMedia,
    } = useChat();

    // DATA

    const {
      data: messagesData,
      isLoading,
      isFetching,
      fetchNextPage,
      hasNextPage,
      isFetchingNextPage,
    } = useGetMessages({ userId: chatId });

    // REFS

    const containerRef = useRef<HTMLDivElement | null>(null);
    const readSet = useRef<Set<string>>(new Set());
    const observer = useRef<IntersectionObserver | null>(null);

    const hasScrolledInitiallyRef = useRef(false);

    const prevScrollHeightRef = useRef(0);
    const prevScrollTopRef = useRef(0);

    const loadingOlderRef = useRef(false);

    const lastMessageIdRef = useRef<string | null>(null);

    // STATE

    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);

    // DERIVED DATA

    const flatMessages: FlatMessage[] =
      messagesData?.pages?.flatMap(
        (page: any) => page?.messages?.items || [],
      ) || [];

    // Deduplicate
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

    const groupedMessages = useMemo(() => {
      const map: Record<
        string,
        {
          label: string;
          timestamp: number;
          messages: FlatMessage[];
        }
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

    // Flat image list

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

      mediaMessages.forEach((m, i) => {
        map.set(m.src, i);
      });

      return map;
    }, [mediaMessages]);

    const isTyping = typingUsers[chatId];

    // HELPERS
    const isNearBottom = () => {
      const el = containerRef.current;
      if (!el) return true;

      return el.scrollHeight - el.scrollTop - el.clientHeight < 180;
    };

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior,
      });
    };

    // Expose the function to the parent
    useImperativeHandle(ref, () => ({
      scrollToBottom,
    }));

    const scrollToMessage = (messageId: string) => {
      const el = containerRef.current;

      if (!el) return;

      const target = el.querySelector(
        `[data-message-id="${messageId}"]`,
      ) as HTMLElement | null;

      if (!target) return;

      target.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      window.dispatchEvent(
        new CustomEvent("highlight-message", {
          detail: { messageId },
        }),
      );
    };

    // RESET WHEN SWITCHING CHATS

    useEffect(() => {
      hasScrolledInitiallyRef.current = false;
      readSet.current = new Set();
      lastMessageIdRef.current = null;
      loadingOlderRef.current = false;
    }, [chatId]);

    // INITIAL SCROLL TO BOTTOM

    useLayoutEffect(() => {
      const el = containerRef.current;

      if (!el) return;
      if (!sortedMessages.length) return;
      if (hasScrolledInitiallyRef.current) return;

      let frame1: number;
      let frame2: number;

      const scrollNow = () => {
        el.scrollTop = el.scrollHeight;
      };

      frame1 = requestAnimationFrame(() => {
        scrollNow();

        frame2 = requestAnimationFrame(() => {
          scrollNow();

          hasScrolledInitiallyRef.current = true;
        });
      });

      const observer = new ResizeObserver(() => {
        if (!hasScrolledInitiallyRef.current) {
          scrollNow();
        }
      });

      observer.observe(el);

      const timeout = setTimeout(() => {
        observer.disconnect();

        hasScrolledInitiallyRef.current = true;

        scrollNow();
      }, 3000);

      return () => {
        cancelAnimationFrame(frame1);
        cancelAnimationFrame(frame2);

        observer.disconnect();

        clearTimeout(timeout);
      };
    }, [chatId, sortedMessages.length]);

    // RESTORE SCROLL AFTER PAGINATION

    useLayoutEffect(() => {
      const el = containerRef.current;
      if (!el || !loadingOlderRef.current) return;

      // Calculate new height after items were prepended
      const newScrollHeight = el.scrollHeight;
      const heightDiff = newScrollHeight - prevScrollHeightRef.current;

      // Maintain scroll position relative to the loaded messages
      el.scrollTop = prevScrollTopRef.current + heightDiff;
      loadingOlderRef.current = false;
    }, [messagesData?.pages]); // Trigger only when page list actually changes

    // AUTO SCROLL ON NEW MESSAGE

    useLayoutEffect(() => {
      if (!hasScrolledInitiallyRef.current) return;
      if (loadingOlderRef.current) return;

      const lastMessage = sortedMessages.at(-1);

      if (!lastMessage) return;

      if (lastMessage.id === lastMessageIdRef.current) return;

      const previousLastId = lastMessageIdRef.current;

      lastMessageIdRef.current = lastMessage.id;

      // Skip hydration/update
      if (!previousLastId) return;

      const isMyMessage = lastMessage.sender_id === authDetails?.user?.id;

      if (isMyMessage || isNearBottom()) {
        requestAnimationFrame(() => {
          scrollToBottom("smooth");
        });
      }
    }, [sortedMessages]);

    const unreadCount = useMemo(() => {
      if (!authDetails?.user?.id) return 0;

      return sortedMessages.filter(
        (m) => m.sender_id !== authDetails.user.id && !m.read_at,
      ).length;
    }, [sortedMessages, authDetails?.user?.id]);

    useEffect(() => {
      onUnreadChange?.(unreadCount);
    }, [unreadCount]);

    // MARK AS READ
    const markVisibleUnreadAsRead = () => {
      const el = containerRef.current;
      if (!el) return;

      const nodes = el.querySelectorAll("[data-message-id]");

      nodes.forEach(async (node) => {
        const id = node.getAttribute("data-message-id");
        if (!id) return;

        const msg = sortedMessages.find((m) => m.id === id);
        if (!msg) return;

        if (msg.sender_id === authDetails?.user?.id) return;
        if (msg.read_at) return;

        await syncMessageRead({
          db: chatDBRef.current,
          queryClient,
          chatId,
          messageId: msg.id,
          userId: authDetails?.user?.id,
        });

        websocket.emit("chat.read", {
          recipient_id: msg.sender_id,
          message_id: msg.id,
        });
      });
    };

    useEffect(() => {
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const messageId = entry.target.getAttribute("data-message-id");
              if (!messageId) return;

              // Find message to check ownership and read status
              const msg = sortedMessages.find((m) => m.id === messageId);

              if (
                msg &&
                msg.sender_id !== authDetails?.user?.id && // Only mark incoming messages
                !msg.read_at &&
                !readSet.current.has(msg.id)
              ) {
                readSet.current.add(msg.id);
                syncMessageRead({
                  db: chatDBRef.current,
                  queryClient,
                  chatId,
                  messageId: msg.id,
                  userId: authDetails?.user?.id,
                });

                websocket.emit("chat.read", {
                  recipient_id: msg.sender_id,
                  message_id: msg.id,
                });
              }
            }
          });
        },
        {
          root: containerRef.current,
          threshold: 0.5, // Triggers when 50% of the message is visible
        },
      );

      // Observe all current rendered message elements
      const elements =
        containerRef.current?.querySelectorAll("[data-message-id]");
      elements?.forEach((el) => observer.current?.observe(el));

      return () => observer.current?.disconnect();
    }, [sortedMessages, chatId]);

    // HANDLERS

    const handleScroll = async () => {
      const el = containerRef.current;
      if (!el) return;

      const nearBottom = isNearBottom();

      onScrollNearBottomChange?.(!nearBottom);

      if (!hasNextPage) return;
      if (isFetchingNextPage) return;

      if (el.scrollTop <= LOAD_MORE_THRESHOLD && !loadingOlderRef.current) {
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
          upload_type: msg.media_type!,
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

    // LOADING STATE
    const hasAnyCachedData =
      (messagesData?.pages?.flatMap((p: any) => p?.messages?.items || [])
        .length ?? 0) > 0;
    const isInitialLoading = isLoading && !hasAnyCachedData;
    if (isInitialLoading) {
      return (
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className={`flex ${i % 2 ? "justify-start" : "justify-end"}`}
            >
              <div className="animate-pulse bg-gray-200 rounded-xl w-1/2 h-10" />
            </div>
          ))}
        </div>
      );
    }

    // EMPTY STATE

    if (!sortedMessages.length && !isFetching) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          No messages yet
        </div>
      );
    }

    // MAIN RENDER

    return (
      <div className="flex flex-col flex-1 overflow-hidden">
        <div
          ref={containerRef}
          onScroll={() => {
            handleScroll();
          }}
          className="flex-1 overflow-y-auto px-6 pt-2 space-y-6 pb-14 md:pb-6 bg-white overscroll-y-none"
        >
          {/* Load older messages */}
          <div className="sticky top-2 z-30 flex justify-center pointer-events-none">
            {isFetchingNextPage && (
              <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-sm rounded-full px-3 py-1 text-[11px] text-gray-500 animate-in fade-in duration-200">
                Loading messages...
              </div>
            )}
          </div>

          {/* Grouped messages */}
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

          {/* Typing */}
          {isTyping && <TypingDots />}

          <div className="h-2" />
        </div>

        {/* Image Viewer */}

        <ImageViewer
          media={mediaMessages}
          startIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          viewerOpen={viewerOpen}
        />
      </div>
    );
  },
);

export default MessageList;
