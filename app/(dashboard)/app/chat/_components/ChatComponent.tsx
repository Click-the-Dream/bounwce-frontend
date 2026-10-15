"use client";
import ChatWindow from "./ChatWindow";
import ChatSidebar from "./SideBar";
import { useParams, useSearchParams } from "next/navigation";
import useUser from "@/app/hooks/use-user";
import { useAuth } from "@/app/context/AuthContext";
import { useGroupSocket } from "@/app/hooks/use-group-socket";

interface ChatComponentProps {
  role?: "buyer" | "vendor";
}

const ChatComponent = ({ role = "buyer" }: ChatComponentProps) => {
  const { chatId } = useParams<any>();
  const searchParams = useSearchParams();
  const selectedGroupId = searchParams.get("groupId") ?? undefined;
  const { authDetails } = useAuth();
  const currentUserId = authDetails?.user?.id ? String(authDetails.user.id) : undefined;
  const groupChat = useGroupSocket(selectedGroupId, true, currentUserId);
  const { useGetUserById } = useUser();
  const { data: selectedUser, isLoading } = useGetUserById(
    !selectedGroupId && typeof chatId === "string" ? chatId : undefined,
  );

  return (
    <div className="flex h-[calc(100dvh-60px)] bg-white min-h-0 overflow-hidden  border-[0.56px] border-t-0 border-l-0 border-[#00000033]">
      <ChatSidebar role={role} selectedUser={selectedUser} selectedGroupId={selectedGroupId} />
      <ChatWindow
        selectedUser={selectedUser}
        selectedGroupId={selectedGroupId}
        groupChat={groupChat}
        currentUserId={currentUserId}
        isConversationLoading={isLoading && !selectedUser && !selectedGroupId}
        role={role}
      />
    </div>
  );
};

export default ChatComponent;
