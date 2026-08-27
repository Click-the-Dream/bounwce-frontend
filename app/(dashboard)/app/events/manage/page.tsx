"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  CalendarX2,
  UserPlus,
  DollarSign,
  Tv,
} from "lucide-react";
import Link from "next/link";
import EventCard from "./_components/EventCard";
import BackBtn from "../_components/BackBtn";
import { Event } from "@/app/_utils/types/event";
import EventCardSkeleton from "./_components/EventCardSkeleton";
import useEvent from "@/app/hooks/use-events";
import MetricCard from "../_components/MetriCard";
import EventFilterDropdown, {
  EventFilterValue,
} from "./_components/EventFilterDropdown";
import PageSizeDropdown from "./_components/PageSizeDropdown";

export default function ManageEventsPage() {
  const { useMyEvents } = useEvent();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<EventFilterValue>("");
  const [filterDate, setFilterDate] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const status = filter === "date" || filter === "" ? "" : filter;
  const date = filter === "date" ? filterDate : "";

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    error,
  } = useMyEvents({
    name: debouncedSearch,
    status,
    date,
    page_size: pageSize,
  });

  const events: Event[] =
    data?.pages.flatMap((page) => page.events ?? page) ?? [];

  const metrics = [
    {
      title: "EVENT CREATED",
      value: events.length.toLocaleString(),
      icon: Tv,
    },
    {
      title: "TOTAL SIGNUPS",
      value: "8,532",
      icon: UserPlus,
    },
    {
      title: "TOTAL REVENUE",
      value: "N350,000",
      icon: DollarSign,
    },
  ];

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

      {/* Header / Search / Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-200 mb-4.5">
        {/* Title + Page Size */}
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">
            Manage Event
          </h1>

          <PageSizeDropdown value={pageSize} onChange={setPageSize} />
        </div>

        {/* Search / Filter / Analytics */}
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
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full bg-white border-[0.53px] border-[#0000004D] rounded-[10px] pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-300 transition"
            />
          </div>

          <EventFilterDropdown
            value={filter}
            date={filterDate}
            onChange={(value) => {
              setFilter(value);

              if (value !== "date") {
                setFilterDate("");
              }
            }}
            onDateChange={setFilterDate}
          />

          <button
            type="button"
            onClick={() => setShowAnalytics((current) => !current)}
            aria-expanded={showAnalytics}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-medium transition shadow-xs cursor-pointer shrink-0 border-[0.53px] ${
              showAnalytics
                ? "bg-black text-white border-black"
                : "bg-transparent border-black text-black"
            }`}
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Analytics */}
      <div
        className={`grid grid-cols-1 md:grid-cols-3 border-b-[0.53px] border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${
          showAnalytics
            ? "mb-4.5 gap-6 pb-4.5 max-h-96 opacity-100"
            : "mb-0 gap-0 pb-0 max-h-0 opacity-0 border-transparent"
        }`}
      >
        {metrics.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            icon={metric.icon}
          />
        ))}
      </div>

      {/* Error */}
      {isError && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-600">
          {(error as Error)?.message || "Failed to load events"}
        </div>
      )}

      {/* Events */}
      <div className="pb-12">
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
          <div className="grid grid-cols-store gap-x-2.5 gap-y-8.75 justify-center">
            {!isLoading &&
              events.map((event) => <EventCard key={event.id} event={event} />)}

            {isLoading &&
              Array.from({ length: pageSize }).map((_, index) => (
                <EventCardSkeleton key={index} />
              ))}
          </div>
        )}
      </div>

      {/* Load More */}
      {hasNextPage && (
        <button
          type="button"
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
