"use client";
import SendMessage from "./SendMessage";
import MessageList from "./MessageList";
import ChatHeader from "./ChatHeader";
import { useParams } from "next/navigation";
import { User } from "@/app/_utils/types/buyer";
import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/app/context/NotificationContext";
import { ShieldAlert } from "lucide-react";

interface ChatWindowProps {
  selectedUser?: User;
  isConversationLoading: boolean;
  role?: "buyer" | "vendor";
}

const ChatWindow = ({
  selectedUser,
  isConversationLoading,
  role = "buyer",
}: ChatWindowProps) => {
  const { chatId } = useParams<{ chatId: string }>();
  const { resetUnread } = useNotifications();
  const scrollListRef = useRef<{
    scrollToBottom: () => void;
    markVisibleUnreadAsRead: () => void;
  }>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isRestrictedUser =
    selectedUser?.full_name === "Bouwnce" ||
    selectedUser?.email === "justclick610@gmail.com";

  useEffect(() => {
    if (!chatId) return;

    resetUnread(chatId);
  }, [chatId]);

  return (
    <div
      className={`w-full flex-1 flex-col bg-white ${chatId ? "flex" : "hidden md:flex"}`}
    >
      {/* Header */}
      <ChatHeader
        selectedChat={selectedUser}
        role={role}
        isLoading={isConversationLoading && !selectedUser}
      />

      {/* Messages */}
      {chatId ? (
        <MessageList
          ref={scrollListRef}
          onScrollNearBottomChange={setShowScrollButton}
          onUnreadChange={setUnreadCount}
        />
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-[#fafafa]">
          <div className="max-w-sm text-center px-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-orange/10 flex items-center justify-center mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.7}
                stroke="currentColor"
                className="size-10 text-orange"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01750 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01750 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01750 0zm0 0h-.375M21 12c0 4.97-4.03 9-9 9a8.96 8.96 0 01-4.255-1.067l-4.126 1.032a.75.75 0 01-.91-.91l1.032-4.126A8.96 8.96 0 013 12c0-4.97 4.03-9 9-9s9 4.03 9 9z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900">
              Your messages
            </h2>

            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Select a conversation from the sidebar to start chatting.
            </p>
          </div>
        </div>
      )}

      {/* Input Area */}
      {chatId ? (
        !selectedUser ? (
          <div className="flex h-[70px] shrink-0 items-center gap-3 border-t border-[#0000004D] bg-white px-4">
            <div className="h-10 flex-1 animate-pulse rounded-xl bg-gray-100" />
            <div className="size-10 animate-pulse rounded-full bg-gray-100" />
          </div>
        ) : isRestrictedUser ? (
          <div className="border-t border-t-[#0000004D] bg-gray-50 px-4 py-3 flex items-center justify-center gap-2">
            <ShieldAlert className="size-4 text-gray-400" />
            <p className="text-[13px] text-gray-500">
              <span className="font-semibold text-gray-700">
                System Policy:
              </span>{" "}
              This conversation is read-only.
            </p>
          </div>
        ) : (
          <SendMessage
            selectedChat={selectedUser}
            showScrollButton={showScrollButton}
            unreadCount={unreadCount}
            onScrollToBottom={() => {
              scrollListRef.current?.scrollToBottom();
              scrollListRef.current?.markVisibleUnreadAsRead();
            }}
          />
        )
      ) : null}
    </div>
  );
};

export default ChatWindow;
