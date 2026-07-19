"use client";
import { Plus } from "lucide-react";
import { EventCard } from "./_components/EventCard";
import { MOCK_EVENTS } from "@/app/_utils/dummy";
import Link from "next/link";
import useEvent from "@/app/hooks/useEvent";

const EventsPage = () => {
  const { useExploreEvents } = useEvent();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useExploreEvents();
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

      {/* Grid Layout Setup */}
      <div className="w-full">
        <div className="grid grid-cols-store gap-x-2.5 gap-y-8.75 pb-12 justify-center">
          {MOCK_EVENTS.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </main>
  );
};

export default EventsPage;
