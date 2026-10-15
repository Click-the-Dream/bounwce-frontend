"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, PlusCircle, Users, MessageCircle } from "lucide-react";
import ChatCard from "./ChatCard";
import { useParams } from "next/navigation";
import NewChatModal from "./NewChatModal";
import useChat from "@/app/hooks/use-chat";
import { User } from "@/app/_utils/types/buyer";
import { ChatUser } from "@/app/_utils/types/chat";
import { useRouter } from "next/navigation";
import { useGroups } from "@/app/hooks/use-groups";
import { useQueryClient } from "@tanstack/react-query";
import CreateGroupModal from "./CreateGroupModal";

interface ChatSidebarProps {
  selectedUser?: User;
  selectedGroupId?: string;
  role?: "buyer" | "vendor";
}

const ChatSidebar = ({ selectedUser, selectedGroupId, role = "buyer" }: ChatSidebarProps) => {
  const { useGetConversations, prefetchMessages } = useChat();
  const { chatId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { groups, isLoading: areGroupsLoading } = useGroups();

  useEffect(() => {
    if (!selectedGroupId) return;
    queryClient.setQueryData<any[]>(["group-conversations"], (old) => {
      if (!old) return old;
      let changed = false;
      const next = old.map((group) => {
        if (String(group.id) !== String(selectedGroupId) || !(group.unread_count > 0)) return group;
        changed = true;
        return { ...group, unread_count: 0 };
      });
      return changed ? next : old;
    });
  }, [selectedGroupId, groups, queryClient]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const params = useMemo(
    () => ({
      page_size: 10,
    }),
    [],
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useGetConversations(params);

  const conversations = useMemo(
    () =>
      data?.pages?.flatMap((page: any) => page?.items || []) || [],
    [data?.pages],
  );

  // Warm the first five conversations as soon as the conversation list arrives.
  // ChatCard continues warming later conversations as they enter the viewport.
  useEffect(() => {
    const firstBatch = conversations
      .slice(0, 5)
      .map((conversation: any) => conversation?.user?.id)
      .filter(Boolean);

    firstBatch.forEach((userId: string) => {
      void prefetchMessages(userId).catch((error) => {
        console.debug("[CHAT] first-batch prefetch skipped", {
          userId,
          error,
        });
      });
    });
  }, [conversations, prefetchMessages]);

  const activeConversation = useMemo(() => {
    if (!selectedUser) return null;

    const existing = conversations?.find(
      (c: any) => c.user?.id === selectedUser.id,
    );

    if (existing) return null;

    return {
      id: `temp-${selectedUser.id}`,
      user: {
        ...selectedUser,
      },
    };
  }, [selectedUser, conversations]);

  const filteredConversations = useMemo(() => {
    const baseList = [...conversations];

    if (activeConversation) {
      baseList.unshift(activeConversation);
    }

    const sortedList = baseList.sort((a: any, b: any) => {
      const aIsBouwnce =
        a.user?.username?.toLowerCase() === "bouwnce" ||
        a.user?.id === "3c729ba4-a89d-4670-ba99-faa91737a5e7";

      const bIsBouwnce =
        b.user?.username?.toLowerCase() === "bouwnce" ||
        b.user?.id === "3c729ba4-a89d-4670-ba99-faa91737a5e7";

      if (aIsBouwnce) return -1;
      if (bIsBouwnce) return 1;

      return 0;
    });

    if (!searchQuery) return sortedList;

    return sortedList.filter((conversation: any) =>
      conversation.user?.full_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }, [conversations, searchQuery, activeConversation]);

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return groups;
    return groups.filter((group) =>
      String(group.name ?? "").toLowerCase().includes(query) ||
      String(group.description ?? "").toLowerCase().includes(query),
    );
  }, [groups, searchQuery]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;

      const isBottom = scrollTop + clientHeight >= scrollHeight - 50;

      if (isBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    container.addEventListener("scroll", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  return (
    <div
      className={`w-80 min-w-80 h-full min-h-0 flex flex-col bg-white border-r-[0.53px] border-[#00000033] overflow-hidden
    ${chatId || selectedGroupId ? "hidden md:flex" : "flex-1 md:flex md:flex-0"}`}
    >
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between h-15.5 border-b-[0.53px] border-[#00000033]">
        <h2 className="text-[16px] font-semibold">Chats</h2>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-8 rounded-full border border-orange bg-orange px-3 text-xs font-medium text-white transition hover:bg-[#ee3d15]"
          >
            <PlusCircle className="mr-1 inline size-3.5" /> New chat
          </button>
          <button
            onClick={() => setIsGroupModalOpen(true)}
            title="Create a group"
            aria-label="Create a group"
            className="flex size-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-orange hover:bg-orange/5 hover:text-orange"
          >
            <Users className="size-4" />
          </button>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative z-5 px-2 pb-[7.73px] my-2 border-b-[0.53px] border-[#00000033]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C] size-4" />

          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-[0.53px] border-[#0000004D] rounded-[10px] py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-b focus:pb-3 placeholder:text-[#9C9C9C]"
          />
        </div>
      </div>

      {/* LIST */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 pb-2"
      >
        {/* GROUP CONVERSATIONS */}
        {filteredGroups.length > 0 ? (
          <section className="mb-3">
            <div className="flex items-center justify-between px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
              <span>Groups</span><span>{filteredGroups.length}</span>
            </div>
            {filteredGroups.map((group) => {
              const last = group.last_message;
              const isActive = String(selectedGroupId ?? "") === String(group.id);
              return (
                <button key={group.id} type="button" onClick={() => router.push(`/app/chat?groupId=${encodeURIComponent(String(group.id))}`)} className={`flex w-full items-center gap-3 rounded-xl border-b border-black/5 px-2 py-3 text-left transition hover:bg-gray-50 ${isActive ? "bg-orange/5" : ""}`}>
                  <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-orange/10 text-orange">
                    {group.avatar_url || group.icon_url ? <img src={String(group.avatar_url ?? group.icon_url)} alt="" className="size-full object-cover" /> : <Users size={17} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium text-gray-800">{group.name || "Group chat"}</span><span className="shrink-0 text-[10px] text-gray-400">{last?.created_at ? new Date(last.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span></span>
                    <span className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-gray-400"><MessageCircle size={12} className="shrink-0"/><span className="truncate">{last?.body || (last?.media_type ? `Sent ${last.media_type}` : group.description || `${group.member_count ?? 0} members`)}</span></span>
                  </span>
                  {(group.unread_count ?? 0) > 0 ? <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange text-[10px] font-semibold text-white">{group.unread_count}</span> : null}
                </button>
              );
            })}
          </section>
        ) : null}

        {isLoading ? (
          <div className="mt-6 text-center text-sm text-gray-400">Loading chats...</div>
        ) : filteredConversations.length > 0 ? (
          <>
            <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">Direct messages</div>
            {filteredConversations.map((chat: ChatUser) => <ChatCard key={chat?.user?.id} chat={chat} />)}
          </>
        ) : filteredGroups.length === 0 ? (
          <div className="mt-6 text-center text-sm text-gray-400">{areGroupsLoading ? "Loading groups…" : "No chats found"}</div>
        ) : null}

        {/* LOADING MORE INDICATOR */}
        {isFetchingNextPage && (
          <div className="text-center text-xs text-gray-400 py-2">
            Loading more...
          </div>
        )}
      </div>

      {/* MODAL */}
      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <CreateGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
      />
    </div>
  );
};

export default ChatSidebar;
