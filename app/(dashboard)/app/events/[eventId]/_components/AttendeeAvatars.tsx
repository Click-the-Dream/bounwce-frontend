"use client";

import useEvents from "@/app/hooks/use-events";
import Image from "next/image";

interface Attendee {
  id: string;
  avatar?: string | null;
  profile_image?: string | null;
  name?: string;
}

interface AttendeeAvatarsProps {
  className?: string;
  eventId: string;
}

const FALLBACK_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
];

const AttendeeAvatars = ({ className, eventId }: AttendeeAvatarsProps) => {
  const { useEventAttendees } = useEvents();

  const {
    data: attendees,
    isLoading,
    isError,
    error,
    refetch,
  } = useEventAttendees(eventId);

  // Loading
  if (isLoading) {
    return (
      <div className={`flex items-center ${className ?? ""}`}>
        <div className="flex -space-x-2">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-6 w-6 animate-pulse rounded-full border-2 border-white bg-gray-200"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <button
        type="button"
        onClick={() => refetch()}
        className={`text-xs font-medium text-gray-500 hover:text-black ${className ?? ""}`}
        title={
          error instanceof Error ? error.message : "Failed to load attendees"
        }
      >
        Unable to load attendees
      </button>
    );
  }

  // Normalize the response in case your API returns
  // { data: [...] } instead of directly [...]
  const attendeeList: Attendee[] = Array.isArray(attendees)
    ? attendees
    : Array.isArray((attendees as any)?.data)
      ? (attendees as any).data
      : [];

  // Empty
  if (attendeeList.length === 0) {
    return (
      <div className={`text-xs font-medium text-gray-500 ${className ?? ""}`}>
        No attendees yet
      </div>
    );
  }

  // Only show first 3 avatars
  const visibleAttendees = attendeeList.slice(0, 3);

  return (
    <div className={`flex items-center ${className ?? ""}`}>
      <div className="flex w-max -space-x-2">
        {visibleAttendees.map((attendee, index) => {
          const image =
            attendee.avatar ||
            attendee.profile_image ||
            FALLBACK_AVATARS[index % FALLBACK_AVATARS.length];

          return (
            <div
              key={attendee.id}
              className="relative h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-gray-200"
            >
              <Image
                src={image}
                alt={attendee.name || `Attendee ${index + 1}`}
                fill
                sizes="24px"
                className="object-cover"
              />
            </div>
          );
        })}
      </div>

      {attendeeList.length > 3 && (
        <span className="ml-1 text-xs font-medium text-gray-600">
          +{attendeeList.length - 3}
        </span>
      )}
    </div>
  );
};

export default AttendeeAvatars;
