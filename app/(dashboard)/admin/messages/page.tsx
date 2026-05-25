"use client";

import { MOCK_CONVERSATIONS } from "@/app/_utils/mock";
import { Conversation } from "@/app/_utils/types/admin";
import { useState } from "react";
import ConversationSidebar from "./_components/ConversationSidebar";
import ChatWindow from "./_components/ChatWindow";
import NewMessageModal from "./_components/NewMessageModal";

export default function Page() {
  const [conversations, setConversations] =
    useState<Conversation[]>(MOCK_CONVERSATIONS);

  const [activeId, setActiveId] = useState(conversations[0].id);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const activeConvo = conversations.find((c) => c.id === activeId)!;

  // ─── send message into existing convo ─────────────────────────
  const handleSendToExisting = (conversationId: string, message: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: `msg-${Date.now()}`,
                  content: message,
                  sentAt: new Date().toISOString(),
                  type: "admin",
                },
              ],
              lastMessageAt: new Date().toISOString(),
            }
          : c,
      ),
    );
  };

  // ─── new message (create/update thread) ───────────────────────
  const handleNewMessage = (userId: string, message: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.user.id === userId
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: `msg-${Date.now()}`,
                  content: message,
                  sentAt: new Date().toISOString(),
                  type: "admin",
                },
              ],
              lastMessageAt: new Date().toISOString(),
            }
          : c,
      ),
    );

    const convo = conversations.find((c) => c.user.id === userId);
    if (convo) setActiveId(convo.id);

    setShowModal(false);
  };

  return (
    <>
      <div className="flex h-full overflow-hidden">
        {/* Sidebar */}
        <ConversationSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={setActiveId}
          search={search}
          setSearch={setSearch}
          onNew={() => setShowModal(true)}
        />

        {/* Chat */}
        <ChatWindow convo={activeConvo} />
      </div>

      {/* Modal */}
      {showModal && (
        <NewMessageModal
          conversations={conversations}
          onClose={() => setShowModal(false)}
          onSend={handleNewMessage}
        />
      )}
    </>
  );
}
