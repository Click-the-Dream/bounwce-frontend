"use client";

import { useEffect, useRef } from "react";
import { Search, PlusCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { Conversation } from "@/app/_utils/types/admin";
import ConversationItem from "./ConversationItem";

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  search: string;
  setSearch: (v: string) => void;
  onNew: () => void;
  isLoading?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

export default function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  search,
  setSearch,
  onNew,
  isLoading = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  fetchNextPage,
}: ConversationSidebarProps) {
  const { chatId } = useParams();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const filtered = conversations.filter(
    (c) =>
      c.user.name.toLowerCase().includes(search.toLowerCase()) ||
      c.user.email.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isBottom = scrollTop + clientHeight >= scrollHeight - 50;
      if (isBottom && hasNextPage && !isFetchingNextPage) {
        fetchNextPage?.();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div
      className={`w-80 min-w-80 h-full min-h-0 flex flex-col bg-white border-r-[0.53px] border-[#00000033] overflow-hidden
        ${chatId ? "hidden md:flex" : "flex-1 md:flex md:flex-none"}`}
    >
      {/* HEADER */}
      <div className="p-4 flex items-center justify-between h-15.5 border-b-[0.53px] border-[#00000033]">
        <h2 className="text-[16px] font-semibold">Messages</h2>

        <button
          onClick={onNew}
          className="cursor-pointer max-w-17.75 h-7.5 flex-1 bg-orange outline-[0.83px] outline-orange border border-[#F4F4F4] hover:bg-[#ee3d15] text-white p-2 rounded-full text-xs font-medium flex items-center justify-center transition-all"
        >
          <PlusCircle fill="#8a0202" className="size-4 mr-1.75" />
          New
        </button>
      </div>

      {/* SEARCH */}
      <div className="relative z-5 px-2 pb-[7.73px] my-2 border-b-[0.53px] border-[#00000033]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9C9C9C] size-4" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border-[0.53px] border-[#0000004D] rounded-[10px] py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-b focus:pb-3 placeholder:text-[#9C9C9C]"
          />
        </div>
      </div>

      {/* LIST */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain px-2 pb-2"
      >
        {isLoading ? (
          <div className="text-center mt-10 text-gray-400 text-sm">
            Loading chats...
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((c) => (
            <ConversationItem
              key={c.id}
              convo={c}
              active={c.id === activeId}
              onClick={() => onSelect(c.id)}
            />
          ))
        ) : (
          <div className="text-center mt-10 text-gray-400 text-sm">
            No messages found
          </div>
        )}

        {isFetchingNextPage && (
          <div className="text-center text-xs text-gray-400 py-2">
            Loading more...
          </div>
        )}
      </div>
    </div>
  );
}
