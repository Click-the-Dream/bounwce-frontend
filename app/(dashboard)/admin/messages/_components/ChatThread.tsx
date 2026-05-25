"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Info, Send, User, MoreHorizontal } from "lucide-react";
import { AdminMessage, Conversation } from "@/app/_utils/types/admin";

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatThread({
  convo,
  onSend,
}: {
  convo: Conversation;
  onSend?: (conversationId: string, message: string) => void;
}) {
  const [messages, setMessages] = useState<AdminMessage[]>(convo.messages);
  const [draft, setDraft] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(convo.messages);
    setDraft("");
  }, [convo.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;

    const newMsg: AdminMessage = {
      id: `msg-${Date.now()}`,
      content: text,
      sentAt: new Date().toISOString(),
      type: "admin",
    };

    setMessages((prev) => [...prev, newMsg]);
    setDraft("");

    onSend?.(convo.id, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-stone-100 flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold ${convo.user.avatarColor}`}
          >
            {convo.user.initials}
          </div>

          <div>
            <p className="text-sm font-bold">{convo.user.name}</p>
            <p className="text-[10px] text-stone-400">
              {convo.user.email} · joined {convo.user.joinedAt}
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          <button className="p-2 hover:bg-stone-100 rounded-full">
            <User size={15} />
          </button>
          <button className="p-2 hover:bg-stone-100 rounded-full">
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col">
            {msg.type === "admin" ? (
              <>
                <div className="flex justify-end">
                  <div className="max-w-[70%] bg-[#ff3b0a] text-white rounded-2xl px-4 py-2.5 text-sm">
                    {msg.content}
                  </div>
                </div>

                <div className="flex justify-end items-center gap-1 mt-1">
                  <Check size={10} className="text-stone-400" />
                  <span className="text-[10px] text-stone-400">
                    Sent · {formatMessageTime(msg.sentAt)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-start">
                  <div className="max-w-[70%] bg-stone-100 border border-stone-200 rounded-2xl px-4 py-2.5 text-sm">
                    {msg.content}
                  </div>
                </div>

                <span className="text-[10px] text-stone-400 mt-1">
                  {formatMessageTime(msg.sentAt)}
                </span>
              </>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Notice */}
      <div className="mx-5 mb-3 flex items-center gap-2 bg-stone-50 border rounded-xl px-3 py-2">
        <Info size={13} className="text-stone-400" />
        <p className="text-[11px] text-stone-400">
          Users cannot reply yet — one-way admin channel.
        </p>
      </div>

      {/* Composer */}
      <div className="px-5 pb-5">
        <div className="flex items-end gap-3 border rounded-2xl px-4 py-3">
          <textarea
            className="flex-1 text-sm outline-none resize-none bg-transparent"
            placeholder={`Message ${convo.user.name.split(" ")[0]}...`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            onClick={handleSend}
            disabled={!draft.trim()}
            className="bg-[#ff3b0a] text-white p-2 rounded-full disabled:opacity-40"
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
