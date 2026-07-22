"use client";

import { AlertCircle } from "lucide-react";
import { useParams } from "next/navigation";

import EventEditor from "../../_components/EventEditor";
import useEvents from "@/app/hooks/use-events";
import { EventEditorSkeleton } from "./_components/EventEditorSkeleton";

export default function UpdateEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { useGetEvent } = useEvents();

  const {
    data: eventData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetEvent(eventId);

  if (isLoading) {
    return <EventEditorSkeleton />;
  }

  if (isError) {
    return (
      <div className="min-h-screen max-w-170 mx-auto px-6 py-16 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
          <AlertCircle size={36} className="mx-auto mb-4 text-red-500" />

          <h2 className="text-lg font-semibold text-gray-900">
            Unable to load event
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            {(error as Error)?.message ??
              "Something went wrong while loading this event."}
          </p>

          <button
            onClick={() => refetch()}
            className="mt-6 rounded-lg bg-[#FF474D] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#e03e43]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Event not found.
      </div>
    );
  }

  return (
    <EventEditor mode="update" eventId={eventId} defaultValues={eventData} />
  );
}
