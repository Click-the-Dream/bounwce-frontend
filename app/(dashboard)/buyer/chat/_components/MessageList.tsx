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
  const { data: messages } = useGetMessages({ conversationId: chatId });
  const { typingUsers } = useChatUtils();

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const chatMessages =
    messages?.pages?.flatMap((page: any) => page.items || []) || [];

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
