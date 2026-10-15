"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ArrowLeft, Check, CheckCheck, Info, MessageCircle, Send, Users, Wifi, WifiOff, Paperclip, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import useChat from "@/app/hooks/use-chat";
import type { GroupChatMessage, GroupSocketController } from "@/app/hooks/use-group-socket";
import { useGroupMembers, useGroups } from "@/app/hooks/use-groups";
import GroupMembersModal from "./GroupMembersModal";

const avatarFrom = (user: any) => {
  const pic = user?.profile_pic;
  if (typeof pic === "string") return pic;
  return pic?.url ?? null;
};
const timeLabel = (date?: string) => date ? new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

export default function GroupChatWindow({ groupId, chat, currentUserId }: {
  groupId: string;
  currentUserId?: string;
  chat: GroupSocketController;
}) {
  const { authDetails } = useAuth();
  const router = useRouter();
  const resolvedCurrentUserId = currentUserId ?? (authDetails?.user?.id ? String(authDetails.user.id) : undefined);
  const { groups } = useGroups();
  const { members } = useGroupMembers(groupId);
  const group = useMemo(() => groups.find((item) => String(item.id) === String(groupId)), [groups, groupId]);
  const memberById = useMemo(() => new Map(members.map((member: any) => [String(member.user_id ?? member.id ?? member.user?.id ?? ""), member])), [members]);
  const [draft, setDraft] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
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

  const send = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    try {
      setSendError("");
      chat.sendMessage(draft.trim());
      setDraft("");
      chat.setTyping(false);
      isTypingRef.current = false;
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    } catch (error: any) {
      setSendError(error?.message ?? "Unable to send message.");
    }
  };

  const uploadAndSendFile = async (file: File) => {
    const mediaType = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
    setIsSendingMedia(true);
    setSendError("");
    try {
      const signatureResponse: any = await getChatSignature({ upload_type: mediaType, count: 1 });
      const signedFields = signatureResponse?.items?.[0] ?? signatureResponse?.fields;
      if (!signedFields) throw new Error("The upload service did not return a signature.");
      const uploaded: any = await uploadToCloudinary(file, { fields: signedFields, constraints: signatureResponse?.constraints });
      if (!uploaded?.secure_url) throw new Error("The uploaded file did not return a secure URL.");
      chat.sendMessage(draft.trim() || file.name, {
        media_type: mediaType,
        media_urls: [uploaded.secure_url],
        media_names: [file.name],
      });
      setDraft("");
      chat.setTyping(false);
      isTypingRef.current = false;
    } catch (error: any) {
      setSendError(error?.response?.data?.message ?? error?.message ?? "Unable to upload this attachment.");
    } finally {
      setIsSendingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveEdit = (message: GroupChatMessage) => {
    if (!editDraft.trim()) return;
    chat.editMessage(message.id, editDraft);
    setEditing(null); setEditDraft("");
  };

  return <div className="flex min-h-0 flex-1 flex-col bg-[#fafafa]">
    <header className="flex h-[66px] shrink-0 items-center justify-between border-b border-black/10 bg-white px-3 md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={() => router.push("/app/chat")} aria-label="Back to chats" className="-ml-1 flex size-8 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 md:hidden"><ArrowLeft size={18}/></button>
        <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange/10 text-orange">{group?.avatar_url || group?.icon_url ? <img src={String(group.avatar_url ?? group.icon_url)} alt="" className="size-full object-cover"/> : <Users size={20}/>}</div>
        <div className="min-w-0"><h2 className="truncate text-sm font-semibold text-gray-900">{group?.name ?? "Group chat"}</h2><p className="truncate text-xs text-gray-500">{typingText || membersText}</p></div>
      </div>
      <div className="flex items-center gap-1.5">
        <span title={chat.isConnected ? "Connected" : "Reconnecting"} className={`hidden items-center gap-1 rounded-full px-2 py-1 text-[10px] sm:flex ${chat.isConnected ? "text-emerald-600" : "text-amber-600"}`}>{chat.isConnected ? <Wifi size={13}/> : <WifiOff size={13}/>} {chat.isConnected ? "Live" : "Reconnecting"}</span>
        <button onClick={() => setShowMembers(true)} className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"><Info size={15}/><span className="hidden sm:inline">Group info</span></button>
      </div>
    </header>

    <div ref={listRef} onScroll={(event) => { const node = event.currentTarget; nearBottomRef.current = node.scrollHeight - node.scrollTop - node.clientHeight < 100; }} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 md:px-6">
      {chat.isLoading ? <div className="space-y-3 py-4">{[1,2,3].map((i) => <div key={i} className={`h-14 max-w-[70%] animate-pulse rounded-2xl bg-gray-200 ${i % 2 ? "mr-auto" : "ml-auto"}`}/>)}</div> : chat.messages.length === 0 ? <div className="flex h-full min-h-48 flex-col items-center justify-center text-center"><div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-orange/10 text-orange"><MessageCircle size={25}/></div><h3 className="text-sm font-semibold text-gray-800">Start the conversation</h3><p className="mt-1 max-w-xs text-xs leading-5 text-gray-500">Messages sent here will be shared with everyone in this group.</p></div> : chat.messages.map((message) => {
        const isMine = String(message.sender_id) === String(resolvedCurrentUserId ?? "");
        const sender = (message as any).sender ?? (message as any).user ?? memberById.get(String(message.sender_id))?.user ?? memberById.get(String(message.sender_id));
        const senderName = sender?.full_name ?? sender?.username ?? (isMine ? "You" : "Group member");
        const avatar = avatarFrom(sender);
        const mediaUrls = message.media_urls ?? [];
        return <div key={message.render_id ?? message.client_id ?? message.id} className={`group flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
          {!isMine ? <div className="mb-1 size-7 shrink-0 overflow-hidden rounded-full bg-gray-200 text-[10px] text-gray-600 flex items-center justify-center">{avatar ? <img src={avatar} alt="" className="size-full object-cover"/> : (senderName[0] ?? "?").toUpperCase()}</div> : null}
          <div className={`max-w-[86%] min-w-[100px] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[75%] ${isMine ? "rounded-br-md bg-[#fff0e9] text-gray-900" : "rounded-bl-md border border-gray-100 bg-white text-gray-900"}`}>
            {!isMine ? <p className="mb-1 text-[11px] font-semibold text-orange">{senderName}</p> : null}
            {editing === message.id ? <div className="flex min-w-44 gap-1"><input value={editDraft} onChange={(e) => setEditDraft(e.target.value)} className="min-w-0 flex-1 rounded border px-2 py-1 text-sm outline-none" autoFocus onKeyDown={(e) => { if (e.key === "Enter") saveEdit(message); if (e.key === "Escape") setEditing(null); }}/><button onClick={() => saveEdit(message)} className="text-xs font-semibold text-orange">Save</button><button onClick={() => setEditing(null)} className="text-xs text-gray-400">Cancel</button></div> : <>
              {mediaUrls.map((url, index) => message.media_type === "image" ? <a href={url} target="_blank" rel="noreferrer" key={`${url}-${index}`}><img src={url} alt={(message.media_names ?? [])[index] ?? "Group image"} className="mb-1 max-h-64 max-w-full rounded-lg object-contain"/></a> : <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="mb-1 block break-all rounded-lg border border-black/10 px-3 py-2 text-xs underline">{(message.media_names ?? [])[index] ?? "Open attachment"}</a>)}
              {message.body ? <p className="whitespace-pre-wrap break-words text-[13px] leading-5">{message.body}</p> : null}
            </>}
            <div className="mt-1 flex items-center justify-end gap-1.5 text-[9px] text-gray-400"><span>{message.is_edited ? "edited · " : ""}{timeLabel(message.created_at)}</span>{isMine ? message.delivery_status === "failed" ? <span className="font-semibold text-red-500">Not sent</span> : message.pending ? <Check size={12}/> : <CheckCheck size={12} className="text-sky-600"/> : null}</div>
            {isMine && !message.pending && !String(message.id).startsWith("optimistic:") && editing !== message.id ? <div className="mt-1 flex justify-end gap-2 opacity-100"><button onClick={() => { setEditing(message.id); setEditDraft(message.body ?? ""); }} className="text-[10px] text-gray-500 hover:text-gray-800">Edit</button><button onClick={() => { if (window.confirm("Delete this message for everyone?")) chat.deleteMessage(message.id); }} className="text-[10px] text-red-500 hover:text-red-700">Delete</button></div> : null}
          </div>
        </div>;
      })}
      {chat.typingUsers.length > 0 ? <div className="flex items-center gap-2 text-xs text-gray-500"><span className="flex items-center gap-1 rounded-full bg-white px-3 py-2 shadow-sm"><span className="size-1.5 animate-bounce rounded-full bg-orange"/><span className="size-1.5 animate-bounce rounded-full bg-orange [animation-delay:120ms]"/><span className="size-1.5 animate-bounce rounded-full bg-orange [animation-delay:240ms]"/></span>{typingText}</div> : null}
    </div>

    {sendError ? <p role="alert" className="border-t bg-white px-4 py-1.5 text-xs text-red-600">{sendError}</p> : null}
    <form onSubmit={send} className="flex shrink-0 items-end gap-2 border-t border-black/10 bg-white px-3 py-3 md:px-5">
      <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.zip,.xls,.xlsx,.ppt,.pptx,.txt,.csv" className="hidden" disabled={isSendingMedia} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadAndSendFile(file); }} />
      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!chat.isConnected || isSendingMedia} aria-label="Attach a file" title="Attach a photo, video, or file" className="flex size-10 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-orange disabled:opacity-50">{isSendingMedia ? <Loader2 size={18} className="animate-spin"/> : <Paperclip size={18}/>}</button>
      <textarea value={draft} onChange={(e) => handleDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e as any); } }} rows={1} maxLength={4000} placeholder="Message the group…" className="max-h-32 min-h-10 flex-1 resize-y rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-orange focus:bg-white" />
      <button type="submit" disabled={!draft.trim() || !chat.isConnected || isSendingMedia} aria-label="Send message" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange text-white transition hover:bg-[#ea4325] disabled:cursor-not-allowed disabled:opacity-50"><Send size={17}/></button>
    </form>
    <GroupMembersModal groupId={groupId} groupName={group?.name ?? "Group chat"} isOpen={showMembers} onClose={() => setShowMembers(false)} currentUserId={resolvedCurrentUserId}/>
  </div>;
}
