"use client";
import SafeImage from "@/app/_components/SafeImage";
import { useChatUtils } from "@/app/context/ChatContext";
import { ChevronLeft } from "lucide-react"; // Import for mobile back button
import { useParams, useRouter } from "next/navigation";

const ChatHeader = () => {
  const router = useRouter();
  const { chatId } = useParams();
  const { selectedChat } = useChatUtils();

  return (
    <div className="h-16 border-b border-[#00000033] flex items-center px-4 md:px-6 gap-3 shrink-0 bg-white">
      <button
        onClick={() => router.push("/buyer/chat")}
        className="cursor-pointer md:hidden p-1 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <ChevronLeft className="size-6 text-black" />
      </button>

      {chatId && selectedChat && (
        <>
          <div
            className="relative shrink-0 rounded-[10px] border border-white"
            style={{
              boxShadow:
                "0px 0px 2.03px 0.51px #00000040, 0.51px -3.05px 2.03px 1.52px #00000040 inset",
            }}
          >
            {selectedChat?.type === "initials" ? (
              <div className="w-9.25 h-9.25 rounded-[10px] bg-gray-100 flex items-center justify-center font-bold text-black text-xs">
                {selectedChat?.initials}
              </div>
            ) : (
              <SafeImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat?.name}${selectedChat?.id}`}
                alt="Profile"
                width={40}
                height={40}
                className="w-9.25 h-9.25 rounded-[10px] object-cover"
              />
            )}

            {/* Active Status Indicator */}
            {selectedChat?.active && (
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-[0.83px] border-white rounded-full"></span>
            )}
          </div>

          <div className="flex flex-col">
            <span className="font-medium text-sm text-black leading-none">
              {selectedChat?.name}
            </span>
            <span className="text-[10px] text-green-600 font-medium">
              {selectedChat?.active ? "Online" : "Offline"}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatHeader;
