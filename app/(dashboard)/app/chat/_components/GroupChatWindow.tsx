"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Info,
  MessageCircle,
  Users,
  Wifi,
  WifiOff,
  Loader2,
  X,
  Video,
  Image as ImageIcon,
  Plus,
  FileText,
  Share2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import useChat from "@/app/hooks/use-chat";
import type {
  GroupChatMessage,
  GroupSocketController,
} from "@/app/hooks/use-group-socket";
import { useGroupMembers, useGroups } from "@/app/hooks/use-groups";
import { formatMessageDate } from "@/app/_utils/formatters";
import GroupMembersModal from "./GroupMembersModal";
import ChatMessage from "./ChatMessage";
import ChatMediaMessage from "./ChatMediaMessage";
import DeleteMessageDialog from "./DeleteMessageDialog";
import ReplyPreview from "./ReplyPreview";
import ImageViewer from "./ImageViewer";
import ChatComposer from "./ChatComposer";
import { isWithinMessageManagementWindow } from "./use-message-management-window";
import GroupMentionPicker, {
  type GroupMentionOption,
} from "./GroupMentionPicker";

const avatarFrom = (user: any) => {
  const pic = user?.profile_pic;
  if (typeof pic === "string") return pic;
  return pic?.url ?? null;
};

const isMediaMessage = (message: GroupChatMessage) =>
  Boolean(message.media_urls?.length) ||
  ["image", "video", "file", "audio"].includes(
    String(message.media_type ?? ""),
  );

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default function GroupChatWindow({
  groupId,
  chat,
  currentUserId,
}: {
  groupId: string;
  currentUserId?: string;
  chat: GroupSocketController;
}) {
  const { authDetails } = useAuth();
  const router = useRouter();
  const resolvedCurrentUserId =
    currentUserId ??
    (authDetails?.user?.id ? String(authDetails.user.id) : undefined);
  const { groups } = useGroups();
  const { members } = useGroupMembers(groupId);
  const group = useMemo(
    () => groups.find((item) => String(item.id) === String(groupId)),
    [groups, groupId],
  );
  const memberById = useMemo(
    () =>
      new Map(
        members.map((member: any) => [
          String(
            member.user_id ??
              member.user?.id ??
              (!member.user ? member.id : "") ??
              "",
          ),
          member,
        ]),
      ),
    [members],
  );
  const [draft, setDraft] = useState("");
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const mentionOptions = useMemo<GroupMentionOption[]>(() => {
    return members
      .filter((member: any) => member.is_active !== false)
      .map((member: any) => {
        const user =
          member.user && typeof member.user === "object" ? member.user : member;
        const id = String(
          member.user_id ?? user.id ?? (!member.user ? member.id : "") ?? "",
        );
        const fullName = String(
          user.full_name ??
            member.full_name ??
            user.username ??
            member.username ??
            "Group member",
        ).trim();
        const username = String(
          user.username ?? member.username ?? fullName.replace(/\s+/g, "_"),
        )
          .trim()
          .replace(/^@/, "");
        return { id, username, fullName, avatar: avatarFrom(user) };
      })
      .filter(
        (member) =>
          member.id &&
          member.username &&
          member.id !== String(resolvedCurrentUserId ?? ""),
      );
  }, [members, resolvedCurrentUserId]);
  const mentionQueryMatch = /(?:^|\s)@([A-Za-z0-9_.-]*)$/.exec(draft);
  const mentionQuery = mentionQueryMatch ? mentionQueryMatch[1] : null;
  const mentionedUserIds = useMemo(() => {
    return mentionOptions
      .filter((member) => {
        const pattern = new RegExp(
          `(^|\\s)@${escapeRegExp(member.username)}(?=$|[\\s,.!?])`,
          "i",
        );
        return pattern.test(draft);
      })
      .map((member) => member.id);
  }, [draft, mentionOptions]);
  const [showMembers, setShowMembers] = useState(false);
  const [replyTarget, setReplyTarget] = useState<GroupChatMessage | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [sendError, setSendError] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [pendingDeleteMessage, setPendingDeleteMessage] =
    useState<GroupChatMessage | null>(null);
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [attachmentAccept, setAttachmentAccept] = useState(
    "image/*,video/*,.pdf,.doc,.docx,.zip,.xls,.xlsx,.ppt,.pptx,.txt,.csv",
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const lastTypingSentAtRef = useRef(0);
  const nearBottomRef = useRef(true);
  const initialScrollDoneRef = useRef(false);
  const loadingOlderRef = useRef(false);
  const priorScrollMetricsRef = useRef({ height: 0, top: 0 });
  const { useGetChatSignature, uploadToCloudinary } = useChat();
  const { mutateAsync: getChatSignature } = useGetChatSignature();

  const mediaMessages = useMemo(() => {
    const flattened: any[] = [];
    for (const message of chat.messages) {
      if (message.media_type !== "image" || !Array.isArray(message.media_urls))
        continue;
      message.media_urls.forEach((url, index) =>
        flattened.push({
          src: url,
          id: `${message.id}-${index}`,
          parent_id: message.id,
          created_at: message.created_at,
          sender: (message as any).sender,
          sender_id: message.sender_id,
        }),
      );
    }
    return flattened;
  }, [chat.messages]);

  const mediaIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    mediaMessages.forEach((media, index) => map.set(media.src, index));
    return map;
  }, [mediaMessages]);

  // Keep an index of the messages currently loaded so replies can render even
  // when the REST response only includes reply_to_message_id (the documented
  // group-message shape). The nested reply object, when supplied by the API,
  // is merged with the locally loaded original for the best preview possible.
  const messageById = useMemo(() => {
    const index = new Map<string, GroupChatMessage>();
    for (const message of chat.messages) {
      if (message?.id) index.set(String(message.id), message);
    }
    return index;
  }, [chat.messages]);

  const groupedMessages = useMemo(() => {
    const sorted = [...chat.messages].sort(
      (a, b) =>
        new Date(a.created_at ?? 0).getTime() -
        new Date(b.created_at ?? 0).getTime(),
    );
    const groups: Array<{
      label: string;
      timestamp: number;
      messages: GroupChatMessage[];
    }> = [];
    for (const message of sorted) {
      const label = formatMessageDate(message.created_at);
      let bucket = groups.find((item) => item.label === label);
      if (!bucket) {
        bucket = {
          label,
          timestamp: new Date(message.created_at).getTime(),
          messages: [],
        };
        groups.push(bucket);
      }
      bucket.messages.push(message);
    }
    return groups.sort((a, b) => a.timestamp - b.timestamp);
  }, [chat.messages]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    if (!initialScrollDoneRef.current) {
      node.scrollTop = node.scrollHeight;
      initialScrollDoneRef.current = true;
      nearBottomRef.current = true;
      return;
    }
    if (nearBottomRef.current) node.scrollTop = node.scrollHeight;
  }, [chat.messages.length, chat.isLoading]);

  useEffect(() => {
    initialScrollDoneRef.current = false;
    loadingOlderRef.current = false;
    setReplyTarget(null);
    setDraft("");
    setSendError("");
  }, [groupId]);

  useEffect(() => {
    if (chat.actionError) setSendError(chat.actionError);
  }, [chat.actionError]);

  useEffect(
    () => () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      isTypingRef.current = false;
      lastTypingSentAtRef.current = 0;
      chat.setTyping(false);
      // `chat.setTyping` is stable for a given group.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [groupId],
  );

  const visibleMemberCount = group?.member_count || members.length;
  const membersText = visibleMemberCount
    ? `${visibleMemberCount} members`
    : "Group conversation";
  const typingText =
    chat.typingUsers.length > 0
      ? chat.typingUsers.length === 1
        ? `${chat.typingUsers[0].username || "Someone"} is typing…`
        : `${chat.typingUsers.length} people are typing…`
      : "";

  const handleDraft = (value: string) => {
    setDraft(value);
    const typing = Boolean(value.trim());
    const now = Date.now();

    // The receiving hook expires typing state after 3.5s. Refresh the signal
    // during sustained typing, without emitting one frame for every keystroke.
    if (
      typing &&
      (!isTypingRef.current || now - lastTypingSentAtRef.current >= 1200)
    ) {
      chat.setTyping(true);
      isTypingRef.current = true;
      lastTypingSentAtRef.current = now;
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (typing) {
      typingTimeout.current = setTimeout(() => {
        chat.setTyping(false);
        isTypingRef.current = false;
        lastTypingSentAtRef.current = 0;
      }, 1800);
    } else if (isTypingRef.current) {
      chat.setTyping(false);
      isTypingRef.current = false;
      lastTypingSentAtRef.current = 0;
    }
  };

  const clearComposer = () => {
    setDraft("");
    const composer = document.getElementById(
      "group-chat-composer",
    ) as HTMLTextAreaElement | null;
    if (composer) composer.style.height = "auto";
    setReplyTarget(null);
    chat.setTyping(false);
    isTypingRef.current = false;
    lastTypingSentAtRef.current = 0;
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  const send = () => {
    if (!draft.trim() || !chat.isConnected || isSendingMedia) return;
    try {
      setSendError("");
      chat.sendMessage(draft.trim(), {
        reply_to_message_id: replyTarget?.id ? String(replyTarget.id) : null,
        mentioned_user_ids: mentionedUserIds,
      });
      clearComposer();
    } catch (error: any) {
      setSendError(error?.message ?? "Unable to send message.");
    }
  };

  const uploadAndSendFile = async (file: File) => {
    const mediaType = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
        ? "video"
        : "file";
    setIsSendingMedia(true);
    setSendError("");
    try {
      const signatureResponse: any = await getChatSignature({
        upload_type: mediaType,
        count: 1,
        file_name: file.name,
      });
      const signedFields =
        signatureResponse?.items?.[0] ?? signatureResponse?.fields;
      if (!signedFields)
        throw new Error("The upload service did not return a signature.");
      const uploaded: any = await uploadToCloudinary(file, {
        fields: signedFields,
        constraints: signatureResponse?.constraints,
      });
      if (!uploaded?.secure_url)
        throw new Error("The uploaded file did not return a secure URL.");
      chat.sendMessage(draft.trim() || file.name, {
        media_type: mediaType,
        media_urls: [uploaded.secure_url],
        media_names: [file.name],
        reply_to_message_id: replyTarget?.id ? String(replyTarget.id) : null,
        mentioned_user_ids: mentionedUserIds,
      });
      clearComposer();
    } catch (error: any) {
      setSendError(
        error?.response?.data?.message ??
          error?.message ??
          "Unable to upload this attachment.",
      );
    } finally {
      setIsSendingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEditMessage = (message: any, body: string) => {
    if (!isWithinMessageManagementWindow(message)) {
      setSendError(
        "Messages can only be edited or deleted within 15 minutes of sending.",
      );
      return false;
    }
    const accepted = chat.editMessage(String(message.id), body);
    if (!accepted)
      setSendError(
        chat.isConnected
          ? "Unable to edit this message."
          : "You are offline. Reconnect before editing this message.",
      );
    else setSendError("");
    return accepted;
  };

  const handleDeleteMessage = (message: GroupChatMessage) => {
    if (!message?.id) return false;
    if (!isWithinMessageManagementWindow(message)) {
      setSendError(
        "Messages can only be edited or deleted within 15 minutes of sending.",
      );
      return false;
    }
    setSendError("");
    setPendingDeleteMessage(message);
    return true;
  };

  const confirmDeleteMessage = () => {
    if (!pendingDeleteMessage?.id) return false;
    if (!isWithinMessageManagementWindow(pendingDeleteMessage)) {
      setPendingDeleteMessage(null);
      setSendError("The 15-minute message-management window has expired.");
      return false;
    }
    const accepted = chat.deleteMessage(String(pendingDeleteMessage.id));
    if (!accepted) {
      setSendError(
        chat.isConnected
          ? "Unable to delete this message."
          : "You are offline. Reconnect before deleting this message.",
      );
    } else {
      setSendError("");
    }
    return accepted;
  };

  const selectMention = (member: GroupMentionOption) => {
    const match = /(^|\s)@[A-Za-z0-9_.-]*$/.exec(draft);
    const prefix = match ? draft.slice(0, match.index) : draft;
    const separator = prefix && !/\s$/.test(prefix) ? " " : "";
    const nextDraft = `${prefix}${separator}@${member.username} `;
    setDraft(nextDraft);
    requestAnimationFrame(() => {
      const input = document.getElementById(
        "group-chat-composer",
      ) as HTMLTextAreaElement | null;
      if (!input) return;
      input.focus();
      input.setSelectionRange(nextDraft.length, nextDraft.length);
    });
  };

  const shareGroup = async () => {
    const url = new URL(
      `/group-invite/${encodeURIComponent(groupId)}`,
      window.location.origin,
    );
    const shareUrl = url.toString();
    const shareTitle = `${group?.name ?? "Group chat"} · Bouwnce`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: `You are invited to view ${group?.name ?? "this group"} on Bouwnce. View the group and contact its admin to request access.`,
          url: shareUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setShareNotice(
        "Group invitation link copied. People can view group details and request to join.",
      );
      window.setTimeout(() => setShareNotice(""), 4500);
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShareNotice(
          "Group invitation link copied. People can view group details and request to join.",
        );
        window.setTimeout(() => setShareNotice(""), 4500);
      } catch {
        setSendError("Unable to share the group link from this browser.");
      }
    }
  };

  const scrollToMessage = async (messageId: string) => {
    const findTarget = () =>
      listRef.current?.querySelector(
        `[data-message-id="${CSS.escape(messageId)}"]`,
      ) as HTMLElement | null;

    let target = findTarget();
    let canLoadMore = chat.hasNextPage;
    let pagesLoaded = 0;

    // The original may be older than the currently loaded history. Load earlier
    // pages until it appears, then scroll to and highlight the original. Always
    // inspect the newly fetched page before stopping at the final page.
    while (!target && canLoadMore && pagesLoaded < 25) {
      const result = await chat.fetchNextPage();
      pagesLoaded += 1;
      canLoadMore = Boolean(result.hasNextPage);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      target = findTarget();
    }

    if (!target) {
      setSendError(
        "The original message is no longer available in the loaded conversation.",
      );
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    window.dispatchEvent(
      new CustomEvent("highlight-message", { detail: { messageId } }),
    );
  };

  const handleReply = (message: GroupChatMessage) => {
    if (!message?.id || String(message.id).startsWith("optimistic:")) {
      setSendError("Wait for the message to finish sending before replying.");
      return;
    }
    setSendError("");
    setReplyTarget(message);
  };

  const handleOpenImage = (url: string) => {
    const index = mediaIndexMap.get(url);
    if (index === undefined) return;
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const retryMedia = (message: any) => {
    if (!message.media_urls?.length) return;
    chat.sendMessage(message.body ?? "", {
      media_type: message.media_type,
      media_urls: message.media_urls,
      media_names: message.media_names,
      reply_to_message_id: message.reply_to_message_id ?? null,
      mentioned_user_ids: message.mentioned_user_ids ?? [],
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#00000033] bg-white px-4 md:px-6">
        <div className="flex w-full items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/app/chat")}
            aria-label="Back to chats"
            className="-ml-1.5 rounded-full p-1 transition hover:bg-gray-100 md:hidden"
          >
            <ArrowLeft className="size-4 text-black" />
          </button>
          <div className="flex size-9.25 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange/10 text-orange">
            {group?.avatar_url || group?.icon_url ? (
              <img
                src={String(group.avatar_url ?? group.icon_url)}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <Users size={20} />
            )}
          </div>
          <div className="">
            <h2 className="flex items-center gap-1.5 truncate text-sm font-medium leading-tight text-black">
              <span className="line-clamp-1">
                {group?.name ?? "Group chat"}
              </span>
            </h2>
            <p className="mt-0.5 truncate text-[10px] font-medium text-green-600">
              {typingText || membersText}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            title={chat.isConnected ? "Connected" : "Reconnecting"}
            className={`hidden items-center gap-1 rounded-full px-2 py-1 text-[10px] sm:flex ${chat.isConnected ? "text-emerald-600" : "text-amber-600"}`}
          >
            {chat.isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {chat.isConnected ? "Live" : "Reconnecting"}
          </span>
          <button
            type="button"
            onClick={() => void shareGroup()}
            aria-label="Share group link"
            title="Share group link"
            className="flex size-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-orange/30 hover:bg-orange/5 hover:text-orange"
          >
            <Share2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => setShowMembers(true)}
            className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Info size={15} />
            <span className="hidden sm:inline">Group info</span>
          </button>
        </div>
      </header>

      {shareNotice ? (
        <p
          role="status"
          className="border-b border-violet-100 bg-violet-50 px-4 py-2 text-xs text-violet-700"
        >
          {shareNotice}
        </p>
      ) : null}

      <div
        ref={listRef}
        onScroll={(event) => {
          const node = event.currentTarget;
          nearBottomRef.current =
            node.scrollHeight - node.scrollTop - node.clientHeight < 100;
          if (
            node.scrollTop <= 72 &&
            chat.hasNextPage &&
            !chat.isFetchingNextPage &&
            !loadingOlderRef.current
          ) {
            loadingOlderRef.current = true;
            priorScrollMetricsRef.current = {
              height: node.scrollHeight,
              top: node.scrollTop,
            };
            void chat.fetchNextPage().finally(() => {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  const currentNode = listRef.current;
                  if (currentNode) {
                    const { height, top } = priorScrollMetricsRef.current;
                    currentNode.scrollTop =
                      top + (currentNode.scrollHeight - height);
                  }
                  loadingOlderRef.current = false;
                });
              });
            });
          }
        }}
        className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-none bg-white px-6 pb-14 pt-2 md:pb-6"
      >
        {chat.isFetchingNextPage ? (
          <div className="flex items-center justify-center gap-2 py-3 text-[11px] text-gray-400">
            <Loader2 size={14} className="animate-spin text-orange" />
            Loading older messages…
          </div>
        ) : chat.hasNextPage ? (
          <div className="py-1 text-center text-[10px] text-gray-300">
            Scroll up to load older messages
          </div>
        ) : null}
        {chat.isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className={`h-14 max-w-[70%] animate-pulse rounded-xl bg-gray-100 ${index % 2 ? "mr-auto" : "ml-auto"}`}
              />
            ))}
          </div>
        ) : chat.messages.length === 0 ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center text-center text-gray-400">
            <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-orange/10 text-orange">
              <MessageCircle size={25} />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">
              Start the conversation
            </h3>
            <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500">
              Messages sent here will be shared with everyone in this group.
            </p>
          </div>
        ) : (
          groupedMessages.map((messageGroup) => (
            <div key={messageGroup.label}>
              <div className="sticky top-0 z-10 my-4 flex justify-center">
                <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs text-gray-500 shadow-sm">
                  {messageGroup.label}
                </span>
              </div>
              <div className="space-y-2">
                {messageGroup.messages.map((message) => {
                  const member = memberById.get(String(message.sender_id));
                  const sender =
                    (message as any).sender ??
                    (message as any).user ??
                    member?.user ??
                    member;
                  const senderName =
                    sender?.full_name ??
                    sender?.username ??
                    (String(message.sender_id) === String(resolvedCurrentUserId)
                      ? "You"
                      : "Group member");
                  const replyId =
                    message.reply_to_message_id ??
                    (message as any).reply_to?.id ??
                    (message as any).reply_to_message?.id ??
                    null;
                  const nestedReply = (message as any).reply_to_message;
                  const locallyLoadedReply = replyId
                    ? messageById.get(String(replyId))
                    : undefined;
                  const replyMessage =
                    nestedReply && typeof nestedReply === "object"
                      ? {
                          ...(locallyLoadedReply ?? {}),
                          ...nestedReply,
                          sender:
                            nestedReply.sender ?? locallyLoadedReply?.sender,
                        }
                      : (locallyLoadedReply ??
                        (replyId
                          ? {
                              id: String(replyId),
                              sender_id: "",
                              body: "Original message is not loaded yet",
                            }
                          : undefined));
                  const displayMessage = {
                    ...message,
                    sender,
                    ...(replyId
                      ? {
                          reply_to: { id: String(replyId) },
                          reply_to_message: replyMessage,
                        }
                      : {}),
                  };
                  const key = String(
                    message.render_id ?? message.client_id ?? message.id,
                  );
                  const commonProps = {
                    msg: displayMessage,
                    mentionUsers: mentionOptions,
                    senderName,
                    senderAvatar: avatarFrom(sender),
                    onReply: (value: GroupChatMessage) => handleReply(value),
                    onScrollToMessage: scrollToMessage,
                    onEdit: handleEditMessage,
                    onDelete: handleDeleteMessage,
                  };

                  return isMediaMessage(message) ? (
                    <ChatMediaMessage
                      key={key}
                      {...commonProps}
                      onOpen={handleOpenImage}
                      onRetry={retryMedia}
                    />
                  ) : (
                    <ChatMessage key={key} {...commonProps} />
                  );
                })}
              </div>
            </div>
          ))
        )}

        {chat.typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1 rounded-full bg-[#EFF3F4] px-3 py-2">
              <span className="size-1.5 animate-bounce rounded-full bg-orange" />
              <span className="size-1.5 animate-bounce rounded-full bg-orange [animation-delay:120ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-orange [animation-delay:240ms]" />
            </span>
            {typingText}
          </div>
        )}
      </div>

      {sendError && (
        <p
          role="alert"
          className="border-t border-red-100 bg-red-50 px-4 py-1.5 text-xs text-red-600"
        >
          {sendError}
        </p>
      )}
      {replyTarget && (
        <div className="flex shrink-0 items-start gap-2 border-t border-black/10 bg-gray-50 px-4 pt-2">
          <div className="min-w-0 flex-1">
            <ReplyPreview reply={replyTarget} isSender={true} />
          </div>
          <button
            type="button"
            onClick={() => setReplyTarget(null)}
            aria-label="Cancel reply"
            className="mt-1 rounded-full p-1 text-gray-500 hover:bg-gray-200"
          >
            <X size={15} />
          </button>
        </div>
      )}
      <div className="shrink-0 border-t border-[#0000004D] bg-white px-3 py-3 md:px-5">
        <input
          ref={fileInputRef}
          type="file"
          accept={attachmentAccept}
          className="hidden"
          disabled={isSendingMedia}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadAndSendFile(file);
          }}
        />
        <ChatComposer
          value={draft}
          onChange={(value) => handleDraft(value)}
          onSend={send}
          inputId="group-chat-composer"
          placeholder="Message the group…"
          ariaLabel="Message the group"
          canSend={Boolean(draft.trim())}
          disabled={!chat.isConnected || isSendingMedia}
          isSending={isSendingMedia}
          sendButtonVisible={Boolean(
            isComposerFocused || draft || isSendingMedia,
          )}
          onFocus={() => setIsComposerFocused(true)}
          onBlur={() => setIsComposerFocused(false)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) return;
            const isMobile = /iPhone|iPad|iPod|Android/i.test(
              navigator.userAgent,
            );
            if (isMobile) return;
            event.preventDefault();
            if (event.nativeEvent.isComposing) return;
            send();
          }}
          leading={
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowAttachmentMenu((open) => !open)}
                disabled={!chat.isConnected || isSendingMedia}
                aria-label="Add attachment"
                aria-expanded={showAttachmentMenu}
                title="Attach a photo, video, or file"
                className="flex size-8 items-center justify-center rounded-full border border-black/10 text-gray-500 transition hover:bg-white hover:text-orange disabled:opacity-50"
              >
                {isSendingMedia ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Plus size={19} />
                )}
              </button>
              {showAttachmentMenu && (
                <div className="absolute bottom-12 left-0 z-30 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl">
                  {[
                    { label: "Photo", accept: "image/*", Icon: ImageIcon },
                    { label: "Video", accept: "video/*", Icon: Video },
                    {
                      label: "Document or file",
                      accept:
                        ".pdf,.doc,.docx,.zip,.xls,.xlsx,.ppt,.pptx,.txt,.csv",
                      Icon: FileText,
                    },
                  ].map(({ label, accept, Icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setAttachmentAccept(accept);
                        setShowAttachmentMenu(false);
                        window.setTimeout(
                          () => fileInputRef.current?.click(),
                          0,
                        );
                      }}
                      className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-gray-700 transition hover:bg-orange/5 hover:text-orange"
                    >
                      <Icon size={17} className="text-orange" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          }
        >
          {mentionQuery !== null ? (
            <GroupMentionPicker
              query={mentionQuery}
              members={mentionOptions}
              onSelect={selectMention}
            />
          ) : null}
        </ChatComposer>
      </div>
      <ImageViewer
        media={mediaMessages}
        startIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
        viewerOpen={viewerOpen}
      />
      <GroupMembersModal
        groupId={groupId}
        groupName={group?.name ?? "Group chat"}
        groupDescription={group?.description ?? ""}
        isOpen={showMembers}
        onClose={() => setShowMembers(false)}
        currentUserId={resolvedCurrentUserId}
      />
      <DeleteMessageDialog
        open={Boolean(pendingDeleteMessage)}
        scope="group"
        preview={
          pendingDeleteMessage?.body ??
          (pendingDeleteMessage?.media_type ? "Attachment" : null)
        }
        onCancel={() => setPendingDeleteMessage(null)}
        onConfirm={confirmDeleteMessage}
      />
    </div>
  );
}
