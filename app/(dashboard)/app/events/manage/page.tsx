"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, Plus, CalendarX2 } from "lucide-react";
import Link from "next/link";
import EventCard from "./_components/EventCard";
import BackBtn from "../_components/BackBtn";
import useEvent from "@/app/hooks/useEvent";
import { Event } from "@/app/_utils/types/event";
import EventCardSkeleton from "./_components/EventCardSkeleton";

export default function ManageEventsPage() {
  const { useMyEvents } = useEvent();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
  } = useMyEvents({
    name: searchQuery,
    status,
  });

  const events: Event[] =
    data?.pages.flatMap((page) => page.events ?? page) ?? [];
  return (
    <div className="w-full max-w-3xl bg-transparent mx-auto min-h-screen px-4 py-8 md:px-6 border-l-[0.53px] border-r-[0.53px] mb-5 border-[#00000033]">
      {/* Top Main Actions Bar */}
      <div className="flex items-center justify-between mb-8">
        <BackBtn />
        <Link
          href="/app/events/create"
          className="flex items-center gap-1 bg-[#FF474D] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-red-600 transition shadow-xs"
        >
          <Plus size={14} strokeWidth={2.5} />
          Create Event
        </Link>
      </div>

      {/* Filter and Count Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">
            Manage Event
          </h1>
          <span className="bg-black text-white text-xs font-medium  rounded-full flex items-center justify-center min-w-5.25 h-5.25">
            {events?.length}
          </span>
        </div>

        {/* Input Bar Group Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={15}
            />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-[0.53px] border-[#0000004D] rounded-[10px] pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-300 transition"
            />
          </div>
          <button
            onClick={() => setStatus(status === "live" ? "" : "live")}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#949494] text-white rounded-lg text-xs font-medium hover:bg-gray-600 transition shadow-xs cursor-pointer"
          >
            <SlidersHorizontal size={13} strokeWidth={2.5} />
            Filter
          </button>
        </div>
      </div>

      {isError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-600">
          {(error as Error)?.message || "Failed to load events"}
        </div>
      )}
      {/* Events Presentation Responsive Layout Grid */}
      <div className="grid grid-cols-store gap-x-2.5 gap-y-8.75 pb-12 justify-center">
        {!isLoading && !isError && events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <CalendarX2 size={38} className="text-gray-400 mb-3" />

            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              No events found
            </h3>

            <p className="text-xs text-gray-500 max-w-xs mb-5">
              {searchQuery
                ? "No events match your search. Try a different keyword."
                : "You haven't created any events yet. Create your first event to get started."}
            </p>

            {!searchQuery && (
              <Link
                href="/app/events/create"
                className="bg-[#FF474D] text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-red-600 transition"
              >
                Create Event
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-store gap-x-2.5 gap-y-8.75 pb-12 justify-center">
            {isLoading &&
              Array.from({ length: 6 }).map((_, index) => (
                <EventCardSkeleton key={index} />
              ))}

            {!isLoading &&
              events.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        )}
      </div>
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mx-auto mt-5 block rounded-lg bg-black px-5 py-2 text-xs text-white disabled:opacity-50"
        >
          {isFetchingNextPage ? "Loading more..." : "Load more"}
        </button>
      )}
    </div>
  );
}
