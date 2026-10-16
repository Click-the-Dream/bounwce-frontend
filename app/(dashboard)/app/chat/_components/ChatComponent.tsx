"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ChatWindow from "./ChatWindow";
import ChatSidebar from "./SideBar";
import { useParams, useSearchParams } from "next/navigation";
import useUser from "@/app/hooks/use-user";
import { useAuth } from "@/app/context/AuthContext";
import { prefetchGroupMessageHistory, useGroupSocket } from "@/app/hooks/use-group-socket";
import { useGroups } from "@/app/hooks/use-groups";

interface ChatComponentProps {
  role?: "buyer" | "vendor";
}

const ChatComponent = ({ role = "buyer" }: ChatComponentProps) => {
  const { chatId } = useParams<any>();
  const searchParams = useSearchParams();
  const selectedGroupId = searchParams.get("groupId") ?? undefined;
  const { authDetails } = useAuth();
  const currentUserId = authDetails?.user?.id ? String(authDetails.user.id) : undefined;
  const queryClient = useQueryClient();
  const { groups, isLoading: areGroupsLoading, isError: groupsLoadFailed } = useGroups();
  const isSelectedGroupMember = Boolean(
    selectedGroupId && groups.some((group) => String(group.id) === String(selectedGroupId)),
  );
  // Do not load group history or open its socket until membership is established
  // by the authenticated group list. A copied group URL can still show metadata.
  const groupChat = useGroupSocket(
    isSelectedGroupMember ? selectedGroupId : undefined,
    true,
    currentUserId,
  );
  const warmGroupIds = groups.slice(0, 5).map((group) => String(group.id)).join("|");

  // Warm recent group histories as soon as the group list is available. The
  // dependency uses only IDs so incoming messages do not repeatedly restart it.
  useEffect(() => {
    warmGroupIds.split("|").filter(Boolean).forEach((groupId) => {
      void prefetchGroupMessageHistory(queryClient, groupId).catch((error) => {
        console.debug("[GROUP CHAT] initial history prefetch skipped", {
          groupId,
          error,
        });
      });
    });
  }, [warmGroupIds, queryClient]);
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
        isGroupMember={isSelectedGroupMember}
        isGroupMembershipLoading={areGroupsLoading}
        isGroupMembershipError={groupsLoadFailed}
        groupChat={groupChat}
        currentUserId={currentUserId}
        isConversationLoading={isLoading && !selectedUser && !selectedGroupId}
        role={role}
      />
    </div>
  );
};

export default ChatComponent;
