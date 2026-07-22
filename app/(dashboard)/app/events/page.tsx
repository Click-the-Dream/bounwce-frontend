"use client";

import { useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Plus, Loader2, AlertCircle, CalendarX2 } from "lucide-react";
import { EventCard } from "./_components/EventCard";
import Link from "next/link";
import { Event } from "@/app/_utils/types/event";
import { EventCardSkeleton } from "./_components/EventCardSkeleton";
import useEvent from "@/app/hooks/use-events";

const EventsPage = () => {
  const { useExploreEvents } = useEvent();
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useExploreEvents();

  // Intersection observer hook to trigger pagination automatically on scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten nested pages safely
  const events: Event[] = data?.pages.flatMap((page) => page?.data ?? []) ?? [];

  return (
    <main className="w-full max-w-3xl bg-transparent mx-auto min-h-screen px-4 py-8 md:px-6 border-l-[0.53px] border-r-[0.53px] mb-5 border-[#00000033]">
      {/* Upper Content Bar */}
      <div className="w-full flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-medium text-black">Events</h1>
          <p className="text-sm text-gray-400 mt-1.5 font-light tracking-wide">
            Browse upcoming and past events
          </p>
        </div>

        {/* Action Header Controls */}
        <div className="flex gap-3 items-center">
          <Link
            href="/app/events/manage"
            className="text-xs font-medium text-gray-700 bg-white border-[0.83px] border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition"
          >
            Manage Events
          </Link>
          <Link
            href="/app/events/create"
            className="text-xs font-medium text-white bg-[#FF474D] rounded-lg px-4 py-2 hover:bg-[#e03e43] transition flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} strokeWidth={2.5} />
            Create Event
          </Link>
        </div>
      </div>

      {/* Main Content View Container */}
      <div className="w-full">
        {/* 1. Initial Skeleton Loading State */}
        {isLoading && (
          <div className="grid grid-cols-store gap-x-2.5 gap-y-8.75 pb-12 justify-center">
            {[...Array(3)].map((_, i) => (
              <EventCardSkeleton />
            ))}
          </div>
        )}

        {/* 2. Error State */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-red-50/50 rounded-2xl border border-red-100 my-4">
            <AlertCircle size={36} className="text-red-500 mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Unable to load events
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mb-5">
              {(error as Error)?.message ||
                "Something went wrong while fetching events. Please check your network connection."}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-white border border-gray-300 shadow-xs rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* 3. Empty State */}
        {!isLoading && !isError && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 my-4">
            <CalendarX2 size={36} className="text-gray-400 mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              No events found
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mb-5">
              There are no events available right now. Be the first to create
              one!
            </p>
            <Link
              href="/app/events/create"
              className="px-4 py-2 bg-[#FF474D] text-white rounded-lg text-xs font-medium hover:bg-[#e03e43] transition"
            >
              Create an Event
            </Link>
          </div>
        )}

        {/* 4. Events Grid & Infinite Scroll Observer */}
        {!isLoading && !isError && events.length > 0 && (
          <>
            <div className="grid grid-cols-store gap-x-2.5 gap-y-8.75 pb-12 justify-center">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>

            {/* Bottom Sentinel Element / Next Page Loader */}
            <div ref={loadMoreRef} className="py-6 flex justify-center">
              {isFetchingNextPage && (
                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                  <Loader2 size={16} className="animate-spin text-[#FF474D]" />
                  Loading more events...
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default EventsPage;
