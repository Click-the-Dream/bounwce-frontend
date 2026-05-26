"use client";
import SafeImage from "@/app/_components/SafeImage";
import { User } from "@/app/_utils/types/buyer";
import { useChatUtils } from "@/app/context/ChatContext";
import { ChevronLeft } from "lucide-react"; // Import for mobile back button
import { useParams, useRouter } from "next/navigation";
import UserImage from "../../_components/UserImage";

interface ChatHeaderProps {
  selectedChat?: User;
  role?: "buyer" | "vendor";
}

const ChatHeader = ({ selectedChat, role = "buyer" }: ChatHeaderProps) => {
  const router = useRouter();
  const { chatId } = useParams();
  const { onlineUsers, typingUsers } = useChatUtils();
  const isOnline = selectedChat?.id ? !!onlineUsers?.[selectedChat.id] : false;
  const isTyping = selectedChat?.id ? !!typingUsers?.[selectedChat.id] : false;
  return (
    <div className="h-16 border-b border-[#00000033] flex items-center px-4 md:px-6 gap-3 shrink-0 bg-white">
      <button
        onClick={() => router.push("/app/chat")}
        className="cursor-pointer md:hidden p-1 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <ChevronLeft className="size-6 text-black" />
      </button>

      {chatId && selectedChat && (
        <>
          <UserImage
            user={selectedChat}
            size={37}
            style={{
              boxShadow:
                "0px 0px 2.03px 0.51px #00000040, 0.51px -3.05px 2.03px 1.52px #00000040 inset",
            }}
          />

          <div className="flex flex-col">
            <span className="font-medium text-sm text-black leading-none line-clamp-2">
              {selectedChat?.full_name}
            </span>
            <span className={"text-[10px] text-green-600 font-medium"}>
              {isTyping ? "Typing..." : isOnline ? "Online" : ""}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatHeader;
