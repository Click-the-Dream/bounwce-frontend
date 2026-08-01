"use client";

import {
  Calendar,
  Clock,
  User,
  Share2,
  Mail,
  Smile,
  RefreshCw,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import useEvents from "@/app/hooks/use-events";
import EventBanner from "./EventBanner";
import { formatEventTime, formatEventDate } from "@/app/_utils/date";
import EventDetailsSkeleton from "./EventDetailsSkeleton";
import Location from "./Location";
import { handleShare } from "@/app/_utils/formatters";
import AttendeeAvatars from "./AttendeeAvatars";
import EventTimer from "./EventTimer";

export default function EventDetailsPage() {
  const router = useRouter();
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
    return <EventDetailsSkeleton />;
  }

  if (isError) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-10 md:px-6 font-sans text-black">
        <div className="flex min-h-100 flex-col items-center justify-center rounded-[10px] border-[0.53px] border-[#00000033] bg-white px-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <span className="text-xl text-red-500">!</span>
          </div>

          <h2 className="text-base font-semibold text-gray-900">
            Unable to load event
          </h2>

          <p className="mt-2 max-w-md text-sm text-gray-500">
            We couldn't load this event right now. Please check your connection
            and try again.
          </p>

          {error instanceof Error && (
            <p className="mt-2 max-w-md text-xs text-gray-400">
              {error.message}
            </p>
          )}

          <div className="mt-6 flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800"
            >
              <RefreshCw size={14} />
              Try again
            </button>

            <button
              onClick={() => router.back()}
              className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 py-10 md:px-6 font-sans text-black">
        <div className="flex min-h-100 flex-col items-center justify-center rounded-[10px] border-[0.53px] border-[#00000033] bg-white px-6 text-center">
          <h2 className="text-base font-semibold text-gray-900">
            Event not found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            This event may have been removed or is no longer available.
          </p>

          <button
            onClick={() => router.back()}
            className="mt-6 rounded-full bg-black px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:px-6 font-sans text-black">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <EventBanner eventData={eventData} />

          {/* Key Metrics */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Date */}
            <div className="flex h-25.5 flex-col justify-between rounded-[10px] border-[0.53px] border-[#00000033] bg-transparent p-4">
              <div className="mb-3 flex items-center text-gray-500">
                <Calendar size={18} strokeWidth={1} />
              </div>

              <div>
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-800">
                  DATE
                </p>

                <p className="text-xs font-normal text-gray-500">
                  {formatEventDate(eventData.date)}
                </p>
              </div>
            </div>

            {/* Time */}
            <div className="flex h-25.5 flex-col justify-between rounded-[10px] border-[0.53px] border-[#00000033] bg-transparent p-4">
              <div className="mb-3 flex items-center text-gray-500">
                <Clock size={18} strokeWidth={1} />
              </div>

              <div>
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-800">
                  TIME
                </p>

                <p className="text-xs font-normal text-gray-500">
                  {formatEventTime(eventData.date)}
                </p>
              </div>
            </div>

            {/* Attending */}
            <div className="flex h-25.5 flex-col justify-between rounded-[10px] border-[0.53px] border-[#00000033] bg-transparent p-4">
              <div className="mb-3 flex items-center text-gray-500">
                <User size={18} strokeWidth={1} />
              </div>

              <div>
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-800">
                  ATTENDING
                </p>

                <p className="text-xs font-normal text-gray-500">
                  {eventData.attending_count || 0} Going
                </p>
              </div>
            </div>
          </div>

          {/* About */}
          <div>
            <h2 className="text-base font-medium text-black">
              About this Event
            </h2>

            <p className="mt-3 text-sm tracking-wide text-gray-600">
              {eventData.desc}
            </p>

            <div className="flex flex-wrap gap-2.5 pt-2">
              {eventData?.interests?.map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="rounded-[5px] bg-[#EFEFEF] px-2.5 py-1 text-xs font-medium capitalize text-orange"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <Location eventData={eventData} />
        </div>

        {/* Right Section */}
        <div className="space-y-2.5">
          {/* Action Card */}
          <div className="relative space-y-2.5 rounded-[10px] border-[0.53px] border-[#00000033] p-4 pb-2 pt-10 shadow-2xs">
            <button
              onClick={() => router.push(`/app/events/${eventId}/payment`)}
              className="w-full cursor-pointer rounded-full bg-black py-3 text-xs font-semibold text-white shadow-xs transition hover:bg-gray-800"
            >
              Continue to buy ticket
            </button>

            <button className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-300 bg-white py-2.5 text-xs font-medium text-gray-800 transition hover:bg-gray-50">
              <Smile size={16} className="text-gray-600" />
              See who is going
            </button>

            <div className="flex w-full items-center justify-end border-t-[0.53px] border-[#00000033] pt-1">
              <AttendeeAvatars eventId={eventData.id} />
            </div>
          </div>

          {/* Share */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border-[0.53px] border-[#00000033] p-4 shadow-2xs">
            <span className="text-xs font-medium text-gray-700">
              Share this event
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleShare(eventData)}
                className="rounded-full border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50"
              >
                <Share2 size={14} />
              </button>

              <button className="rounded-full border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50">
                <Mail size={14} />
              </button>
            </div>
          </div>

          <EventTimer targetDate={eventData.date} />
        </div>
      </div>
    </div>
  );
}
