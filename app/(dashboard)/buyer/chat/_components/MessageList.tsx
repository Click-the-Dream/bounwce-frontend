"use client";

import { useEffect, useRef, useState } from "react";
import { useChatUtils } from "@/app/context/ChatContext";
import { MessageSquareDashed } from "lucide-react";
import ChatMessage from "./ChatMessage";
import ChatImageMessage from "./ChatImageMessage";
import ImageViewer from "./ImageViewer";
import { User } from "@/app/_utils/types/buyer";
import useChat from "@/app/hooks/use-chat";
import { useParams } from "next/navigation";

const MessageList = ({ selectedChat }: { selectedChat: User }) => {
  const { chatId } = useParams<any>();
  const { useGetMessages } = useChat();
  const { data: messages, isLoading } = useGetMessages({
    userId: chatId,
  });
  const { typingUsers } = useChatUtils();

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const chatMessages =
    messages?.pages?.flatMap((page: any) => page?.messages?.items || []) || [];

  // FLATTEN IMAGES FOR VIEWER
  const mediaImages =
    chatMessages
      ?.filter((m: any) => m.images?.length > 0)
      .flatMap((m: any) =>
        m.images.map((img: string) => ({
          src: img,
          messageId: m.id,
        })),
      ) || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, typingUsers]);

  if (!selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="bg-[#F4F4F4] p-4 rounded-full mb-4">
          <MessageSquareDashed className="size-8 text-[#9C9C9C]" />
        </div>
        <h3 className="text-[13px] font-semibold text-black">Your Messages</h3>
        <p className="text-xs text-[#9C9C9C] max-w-62.5 mt-2">
          Select a conversation from the sidebar to start gisting.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {[...Array(6)].map((_, i) => {
          const isMe = i % 2 === 0;

          return (
            <div
              key={i}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`
                animate-pulse rounded-2xl px-4 py-3
                ${isMe ? "bg-gray-200" : "bg-gray-100"}
              `}
                style={{
                  width: `${Math.random() * 40 + 30}%`,
                  height: "40px",
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  if (chatMessages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <div className="bg-gray-100 p-4 rounded-full mb-3">
          <MessageSquareDashed className="size-6 text-gray-400" />
        </div>

        <p className="text-sm text-gray-500">No messages yet</p>

        <p className="text-xs text-gray-400 mt-1">Start the conversation 👋</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
      {chatMessages?.map((msg: any) =>
        msg.images?.length > 0 ? (
          <ChatImageMessage
            key={msg.id}
            msg={msg}
            mediaImages={mediaImages}
            onOpen={(index: number) => {
              setViewerIndex(index);
              setViewerOpen(true);
            }}
          />
        ) : (
          <ChatMessage key={msg.id} msg={msg} />
        ),
      )}

      {/* Typing */}
      {typingUsers[selectedChat.id] && (
        <div className="text-sm text-gray-400 italic">typing...</div>
      )}

      <div ref={bottomRef} />

      {viewerOpen && (
        <ImageViewer
          media={mediaImages}
          startIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          user={selectedChat}
        />
      )}
    </div>
  );
};

export default MessageList;
