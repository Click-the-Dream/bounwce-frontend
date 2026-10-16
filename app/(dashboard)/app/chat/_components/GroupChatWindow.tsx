"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  Info,
  MessageCircle,
  Paperclip,
  Send,
  Users,
  Wifi,
  WifiOff,
  Loader2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import useChat from "@/app/hooks/use-chat";
import type { GroupChatMessage, GroupSocketController } from "@/app/hooks/use-group-socket";
import { useGroupMembers, useGroups } from "@/app/hooks/use-groups";
import { formatMessageDate } from "@/app/_utils/formatters";
import GroupMembersModal from "./GroupMembersModal";
import ChatMessage from "./ChatMessage";
import ChatMediaMessage from "./ChatMediaMessage";
import ReplyPreview from "./ReplyPreview";
import ImageViewer from "./ImageViewer";

const avatarFrom = (user: any) => {
  const pic = user?.profile_pic;
  if (typeof pic === "string") return pic;
  return pic?.url ?? null;
};

const isMediaMessage = (message: GroupChatMessage) =>
  Boolean(message.media_urls?.length) ||
  ["image", "video", "file", "audio"].includes(String(message.media_type ?? ""));

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
  const resolvedCurrentUserId = currentUserId ?? (authDetails?.user?.id ? String(authDetails.user.id) : undefined);
  const { groups } = useGroups();
  const { members } = useGroupMembers(groupId);
  const group = useMemo(
    () => groups.find((item) => String(item.id) === String(groupId)),
    [groups, groupId],
  );
  const memberById = useMemo(
    () => new Map(members.map((member: any) => [String(member.user_id ?? member.id ?? member.user?.id ?? ""), member])),
    [members],
  );
  const [draft, setDraft] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [replyTarget, setReplyTarget] = useState<GroupChatMessage | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [sendError, setSendError] = useState("");
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const nearBottomRef = useRef(true);
  const initialScrollDoneRef = useRef(false);
  const { useGetChatSignature, uploadToCloudinary } = useChat();
  const { mutateAsync: getChatSignature } = useGetChatSignature();

  const mediaMessages = useMemo(() => {
    const flattened: any[] = [];
    for (const message of chat.messages) {
      if (message.media_type !== "image" || !Array.isArray(message.media_urls)) continue;
      message.media_urls.forEach((url, index) => flattened.push({
        src: url,
        id: `${message.id}-${index}`,
        parent_id: message.id,
        created_at: message.created_at,
        sender: (message as any).sender,
        sender_id: message.sender_id,
      }));
    }
    return flattened;
  }, [chat.messages]);

  const mediaIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    mediaMessages.forEach((media, index) => map.set(media.src, index));
    return map;
  }, [mediaMessages]);

  const groupedMessages = useMemo(() => {
    const sorted = [...chat.messages].sort(
      (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime(),
    );
    const groups: Array<{ label: string; timestamp: number; messages: GroupChatMessage[] }> = [];
    for (const message of sorted) {
      const label = formatMessageDate(message.created_at);
      let bucket = groups.find((item) => item.label === label);
      if (!bucket) {
        bucket = { label, timestamp: new Date(message.created_at).getTime(), messages: [] };
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
    setReplyTarget(null);
    setDraft("");
    setSendError("");
  }, [groupId]);

  useEffect(() => {
    if (chat.actionError) setSendError(chat.actionError);
  }, [chat.actionError]);

  useEffect(() => () => {
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    isTypingRef.current = false;
    chat.setTyping(false);
  // `chat.setTyping` is stable for a given group.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const visibleMemberCount = group?.member_count || members.length;
  const membersText = visibleMemberCount ? `${visibleMemberCount} members` : "Group conversation";
  const typingText = chat.typingUsers.length > 0
    ? chat.typingUsers.length === 1
      ? `${chat.typingUsers[0].username || "Someone"} is typing…`
      : `${chat.typingUsers.length} people are typing…`
    : "";

  const handleDraft = (value: string) => {
    setDraft(value);
    const typing = Boolean(value.trim());
    if (typing && !isTypingRef.current) {
      chat.setTyping(true);
      isTypingRef.current = true;
    }
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    if (typing) {
      typingTimeout.current = setTimeout(() => {
        chat.setTyping(false);
        isTypingRef.current = false;
      }, 1800);
    } else if (isTypingRef.current) {
      chat.setTyping(false);
      isTypingRef.current = false;
    }
  };

  const clearComposer = () => {
    setDraft("");
    setReplyTarget(null);
    chat.setTyping(false);
    isTypingRef.current = false;
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  };

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    try {
      setSendError("");
      chat.sendMessage(draft.trim(), { reply_to_message_id: replyTarget?.id ?? null });
      clearComposer();
    } catch (error: any) {
      setSendError(error?.message ?? "Unable to send message.");
    }
  };

  const uploadAndSendFile = async (file: File) => {
    const mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
    setIsSendingMedia(true);
    setSendError("");
    try {
      const signatureResponse: any = await getChatSignature({ upload_type: mediaType, count: 1, file_name: file.name });
      const signedFields = signatureResponse?.items?.[0] ?? signatureResponse?.fields;
      if (!signedFields) throw new Error("The upload service did not return a signature.");
      const uploaded: any = await uploadToCloudinary(file, { fields: signedFields, constraints: signatureResponse?.constraints });
      if (!uploaded?.secure_url) throw new Error("The uploaded file did not return a secure URL.");
      chat.sendMessage(draft.trim() || file.name, {
        media_type: mediaType,
        media_urls: [uploaded.secure_url],
        media_names: [file.name],
        reply_to_message_id: replyTarget?.id ?? null,
      });
      clearComposer();
    } catch (error: any) {
      setSendError(error?.response?.data?.message ?? error?.message ?? "Unable to upload this attachment.");
    } finally {
      setIsSendingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleEditMessage = (message: any, body: string) => {
    const accepted = chat.editMessage(String(message.id), body);
    if (!accepted) setSendError(chat.isConnected ? "Unable to edit this message." : "You are offline. Reconnect before editing this message.");
    else setSendError("");
    return accepted;
  };

  const handleDeleteMessage = (message: any) => {
    if (!window.confirm("Delete this message for everyone?")) return false;
    const accepted = chat.deleteMessage(String(message.id));
    if (!accepted) setSendError(chat.isConnected ? "Unable to delete this message." : "You are offline. Reconnect before deleting this message.");
    else setSendError("");
    return accepted;
  };

  const scrollToMessage = (messageId: string) => {
    const target = listRef.current?.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement | null;
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    window.dispatchEvent(new CustomEvent("highlight-message", { detail: { messageId } }));
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
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#00000033] bg-white px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => router.push("/app/chat")} aria-label="Back to chats" className="-ml-2 rounded-full p-1 transition hover:bg-gray-100 md:hidden">
            <ArrowLeft className="size-6 text-black" />
          </button>
          <div className="flex size-[37px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange/10 text-orange">
            {group?.avatar_url || group?.icon_url ? <img src={String(group.avatar_url ?? group.icon_url)} alt="" className="size-full object-cover" /> : <Users size={20} />}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium leading-tight text-black">{group?.name ?? "Group chat"}</h2>
            <p className="mt-0.5 truncate text-[10px] font-medium text-green-600">{typingText || membersText}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span title={chat.isConnected ? "Connected" : "Reconnecting"} className={`hidden items-center gap-1 rounded-full px-2 py-1 text-[10px] sm:flex ${chat.isConnected ? "text-emerald-600" : "text-amber-600"}`}>
            {chat.isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {chat.isConnected ? "Live" : "Reconnecting"}
          </span>
          <button type="button" onClick={() => setShowMembers(true)} className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50">
            <Info size={15} /><span className="hidden sm:inline">Group info</span>
          </button>
        </div>
      </header>

      <div
        ref={listRef}
        onScroll={(event) => {
          const node = event.currentTarget;
          nearBottomRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 100;
        }}
        className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-y-none bg-white px-6 pb-14 pt-2 md:pb-6"
      >
        {chat.isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((index) => <div key={index} className={`h-14 max-w-[70%] animate-pulse rounded-xl bg-gray-100 ${index % 2 ? "mr-auto" : "ml-auto"}`} />)}
          </div>
        ) : chat.messages.length === 0 ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center text-center text-gray-400">
            <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-orange/10 text-orange"><MessageCircle size={25} /></div>
            <h3 className="text-sm font-semibold text-gray-800">Start the conversation</h3>
            <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500">Messages sent here will be shared with everyone in this group.</p>
          </div>
        ) : groupedMessages.map((messageGroup) => (
          <div key={messageGroup.label}>
            <div className="sticky top-0 z-10 my-4 flex justify-center">
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs text-gray-500 shadow-sm">{messageGroup.label}</span>
            </div>
            <div className="space-y-2">
              {messageGroup.messages.map((message) => {
                const member = memberById.get(String(message.sender_id));
                const sender = (message as any).sender ?? (message as any).user ?? member?.user ?? member;
                const senderName = sender?.full_name ?? sender?.username ?? (String(message.sender_id) === String(resolvedCurrentUserId) ? "You" : "Group member");
                const displayMessage = { ...message, sender };
                const key = String(message.render_id ?? message.client_id ?? message.id);
                const commonProps = {
                  msg: displayMessage,
                  senderName,
                  senderAvatar: avatarFrom(sender),
                  onReply: (value: any) => setReplyTarget(value),
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
        ))}

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

      {sendError && <p role="alert" className="border-t border-red-100 bg-red-50 px-4 py-1.5 text-xs text-red-600">{sendError}</p>}
      {replyTarget && (
        <div className="flex shrink-0 items-start gap-2 border-t border-black/10 bg-gray-50 px-4 pt-2">
          <div className="min-w-0 flex-1">
            <ReplyPreview reply={replyTarget} isSender={true} />
          </div>
          <button type="button" onClick={() => setReplyTarget(null)} aria-label="Cancel reply" className="mt-1 rounded-full p-1 text-gray-500 hover:bg-gray-200"><X size={15} /></button>
        </div>
      )}
      <form onSubmit={send} className="flex shrink-0 items-end gap-2 border-t border-[#0000004D] bg-white px-3 py-3 md:px-5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.zip,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
          className="hidden"
          disabled={isSendingMedia}
          onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadAndSendFile(file); }}
        />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!chat.isConnected || isSendingMedia} aria-label="Attach a file" title="Attach a photo, video, or file" className="flex size-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-orange disabled:opacity-50">
          {isSendingMedia ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
        </button>
        <textarea
          value={draft}
          onChange={(event) => handleDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(event as any); } }}
          rows={1}
          maxLength={4000}
          placeholder="Message the group…"
          className="max-h-32 min-h-10 flex-1 resize-y rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-orange focus:bg-white"
        />
        <button type="submit" disabled={!draft.trim() || !chat.isConnected || isSendingMedia} aria-label="Send message" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange text-white transition hover:bg-[#ea4325] disabled:cursor-not-allowed disabled:opacity-50">
          <Send size={17} />
        </button>
      </form>
      <ImageViewer
        media={mediaMessages}
        startIndex={viewerIndex}
        onClose={() => setViewerOpen(false)}
        viewerOpen={viewerOpen}
      />
      <GroupMembersModal groupId={groupId} groupName={group?.name ?? "Group chat"} isOpen={showMembers} onClose={() => setShowMembers(false)} currentUserId={resolvedCurrentUserId} />
    </div>
  );
}
