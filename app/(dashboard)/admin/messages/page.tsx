"use client";

import { useState } from "react";
import { Radio } from "lucide-react";
import ConversationSidebar from "./_components/ConversationSidebar";
import BroadcastModal from "./_components/BroadcastModal";
import { Conversation } from "@/app/_utils/types/admin";

// ─── Placeholder empty state ───────────────────────────────────────────────────
// Replace with your real useGetConversations hook when the direct chat is ready

function BroadcastEmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
      <div className="w-14 h-14 rounded-full bg-orange/10 flex items-center justify-center">
        <Radio size={24} className="text-orange" />
      </div>
      <div>
        <h3 className="text-[15px] font-semibold text-gray-800">
          No messages yet
        </h3>
        <p className="text-sm text-[#9C9C9C] mt-1 max-w-xs">
          Send a broadcast to reach users directly in their chat inbox. Select
          all users or target specific ones.
        </p>
      </div>
      <button
        onClick={onNew}
        className="mt-2 flex items-center gap-2 bg-orange hover:bg-[#ee3d15] text-white px-5 py-2.5 rounded-full text-xs font-medium transition-all"
      >
        <Radio size={13} />
        New Broadcast
      </button>
    </div>
  );
}

// ─── Broadcast log item (right panel when a convo is selected) ─────────────────
function BroadcastLogView({ convo }: { convo: Conversation }) {
  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Header */}
      <div className="h-15.5 flex items-center gap-3 px-5 border-b-[0.53px] border-[#00000033] shrink-0">
        <div className="w-9 h-9 rounded-full bg-orange/10 flex items-center justify-center text-[11px] font-bold text-orange">
          {convo.user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {convo.user.name}
          </p>
          <p className="text-[10px] text-[#9C9C9C]">{convo.user.email}</p>
        </div>
      </div>

      {/* Messages log */}
      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4">
        {convo.messages.map((msg) => (
          <div key={msg.id} className="flex flex-col items-end gap-1">
            <div className="max-w-[70%] bg-orange text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">
              {msg.content}
            </div>
            <span className="text-[10px] text-[#9C9C9C]">
              Sent ·{" "}
              {new Date(msg.sentAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>

      {/* Notice — no reply */}
      <div className="mx-5 mb-5 flex items-center gap-2 bg-stone-50 border-[0.53px] border-[#00000033] rounded-[10px] px-4 py-3">
        <Radio size={13} className="text-[#9C9C9C] shrink-0" />
        <p className="text-[11px] text-[#9C9C9C]">
          This is a broadcast channel — users receive messages in their DMs but
          can't reply yet.
        </p>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

// Replace MOCK_CONVERSATIONS with your real data from useGetConversations
const INITIAL_CONVERSATIONS: Conversation[] = [];

// Replace with your real user list from useGetUsers or similar
const MOCK_USERS = [
  { id: "u1", full_name: "Ade Okafor", email: "ade@example.com" },
  { id: "u2", full_name: "Fatima Malik", email: "fatima@example.com" },
  { id: "u3", full_name: "Kofi Entsie", email: "kofi@example.com" },
  { id: "u4", full_name: "Ngozi Bello", email: "ngozi@example.com" },
  { id: "u5", full_name: "Tunde James", email: "tunde@example.com" },
];

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(
    INITIAL_CONVERSATIONS,
  );
  const [activeId, setActiveId] = useState<string | null>(
    conversations[0]?.id ?? null,
  );
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const activeConvo = conversations.find((c) => c.id === activeId) ?? null;

  // After a successful broadcast, optimistically add it to the log
  const handleBroadcastSent = () => {
    // In production: invalidate your conversations query here
    // queryClient.invalidateQueries({ queryKey: ["admin-conversations"] })
  };

  return (
    <>
      <div className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <ConversationSidebar
          conversations={conversations}
          activeId={activeId ?? ""}
          onSelect={setActiveId}
          search={search}
          setSearch={setSearch}
          onNew={() => setShowModal(true)}
        />

        {/* Main panel */}
        {activeConvo ? (
          <BroadcastLogView convo={activeConvo} />
        ) : (
          <BroadcastEmptyState onNew={() => setShowModal(true)} />
        )}
      </div>

      {/* Broadcast modal */}
      {showModal && (
        <BroadcastModal
          onClose={() => setShowModal(false)}
          onSent={handleBroadcastSent}
        />
      )}
    </>
  );
}
