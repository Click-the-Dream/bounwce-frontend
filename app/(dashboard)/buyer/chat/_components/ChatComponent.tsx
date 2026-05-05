"use client";
import { useEffect } from "react";
import ChatWindow from "./ChatWindow";
import ChatSidebar from "./SideBar";
import { useParams } from "next/navigation";
import { useChatUtils } from "@/app/context/ChatContext";
import { CHATS } from "@/app/_utils/dummy";
import useUser from "@/app/hooks/use-user";

const ChatComponent = () => {
  const { chatId } = useParams<any>();
  const { useGetUserById } = useUser();
  const { data: selectedUser, isLoading, isFetching } = useGetUserById(chatId);
  return (
    <div className="flex h-[calc(100vh-60px)] bg-white overflow-hidden  border-[0.56px] border-t-0 border-l-0 border-[#00000033]">
      <ChatSidebar selectedUser={selectedUser} />
      <ChatWindow
        selectedUser={selectedUser}
        isConversationLoading={isLoading || isFetching}
      />
    </div>
  );
};

export default ChatComponent;
