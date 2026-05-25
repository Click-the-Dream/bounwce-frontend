"use client";

import { MOCK_CONVERSATIONS } from "@/app/_utils/mock";
import { Conversation } from "@/app/_utils/types/admin";
import { useState } from "react";
import AdminMessagingLayout from "./ChatLayout";
import ConversationSidebar from "./ConversationSidebar";
import ChatWindow from "./ChatWindow";
import NewMessageModal from "./NewMessageModal";

export default function AdminMessaging() {
  const [conversations, setConversations] =
    useState<Conversation[]>(MOCK_CONVERSATIONS);

  const [activeId, setActiveId] = useState(conversations[0].id);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);

  const activeConvo = conversations.find((c) => c.id === activeId)!;

  const handleNewMessage = (userId: string, content: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.user.id === userId
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: `msg-${Date.now()}`,
                  content,
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

  return (
    <>
      <AdminMessagingLayout
        sidebar={
          <ConversationSidebar
            conversations={conversations}
            activeId={activeId}
            onSelect={setActiveId}
            search={search}
            setSearch={setSearch}
            onNew={() => setShowNew(true)}
          />
        }
        chat={<ChatWindow convo={activeConvo} />}
      />

      {showNew && (
        <NewMessageModal
          conversations={conversations}
          onClose={() => setShowNew(false)}
          onSend={handleNewMessage}
        />
      )}
    </>
  );
}
