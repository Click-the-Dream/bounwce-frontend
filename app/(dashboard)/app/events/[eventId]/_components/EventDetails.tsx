"use client";

import { Calendar, Clock, User, Share2, Mail, Smile } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import useEvents from "@/app/hooks/use-events";
import EventBanner from "./EventBanner";
import { formatEventTime, formatEventDate } from "@/app/_utils/date";
import EventDetailsSkeleton from "./EventDetailsSkeleton";
import Location from "./Location";
import { handleShare } from "@/app/_utils/formatters";
import AttendeeAvatars from "./AttendeeAvatars";

const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
];

export default function EventDetailsPage() {
  const router = useRouter();
  const { eventId } = useParams<{ eventId: string }>();
  const { useGetEvent, useEventAttendees } = useEvents();
  const { data: attendees } = useEventAttendees(eventId);

  const {
    data: eventData = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useGetEvent(eventId);

  if (isLoading) {
    return <EventDetailsSkeleton />;
  }
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:px-6 font-sans text-black">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          <EventBanner eventData={eventData} />

          {/* Key Metrics Grid (Date, Time, Attending) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Box */}
            <div className="border-[0.53px] h-25.5 border-[#00000033] rounded-[10px] p-4 bg-transparent flex flex-col justify-between">
              <div className="flex items-center text-gray-500 mb-3">
                <Calendar size={18} strokeWidth={1} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-800 tracking-wider uppercase mb-0.5">
                  DATE
                </p>
                <p className="text-xs text-gray-500 font-normal">
                  {formatEventDate(eventData.date)}
                </p>
              </div>
            </div>

            {/* Time Box */}
            <div className="border-[0.53px] h-25.5 border-[#00000033] rounded-[10px] p-4 bg-transparent flex flex-col justify-between">
              <div className="flex items-center text-gray-500 mb-3">
                <Clock size={18} strokeWidth={1} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-800 tracking-wider uppercase mb-0.5">
                  TIME
                </p>
                <p className="text-xs text-gray-500 font-normal">
                  {formatEventTime(eventData.date)}
                </p>
              </div>
            </div>

            {/* Attending Box */}
            <div className="border-[0.53px] h-25.5 border-[#00000033] rounded-[10px] p-4 bg-transparent flex flex-col justify-between">
              <div className="flex items-center text-gray-500 mb-3">
                <User size={18} strokeWidth={1} />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-gray-800 tracking-wider uppercase mb-0.5">
                  ATTENDING
                </p>
                <p className="text-xs text-gray-500 font-normal">
                  {eventData?.attending_count || 0} Going
                </p>
              </div>
            </div>
          </div>

          {/* About This Event */}
          <div className="">
            <h2 className="text-base font-medium text-black">
              About this Event
            </h2>
            <p className="text-sm text-gray-600 tracking-wide mt-3">
              {eventData.desc}
            </p>

            {/* Category Tags */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              {eventData?.interests?.map((tag: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-[5px] text-xs text-orange bg-[#EFEFEF] font-medium capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Location Map Section */}
          <Location eventData={eventData} />
        </div>

        {/* Right Section (Buy Ticket Sidebar) */}
        <div className="space-y-2.5">
          {/* Action Card */}
          <div className="relative border-[0.53px] border-[#00000033] rounded-[10px] p-4 pt-10 pb-2 shadow-2xs space-y-2.5">
            <button
              onClick={() => router.push(`/app/events/${eventId}/payment`)}
              className="w-full py-3 bg-black text-white text-xs font-semibold rounded-full hover:bg-gray-800 transition shadow-xs cursor-pointer"
            >
              Continue to buy ticket
            </button>

            <button className="w-full py-2.5 bg-white border border-gray-300 text-gray-800 text-xs font-medium rounded-full hover:bg-gray-50 transition flex items-center justify-center gap-2 cursor-pointer">
              <Smile size={16} className="text-gray-600" />
              See who is going
            </button>

            {/* Attendees Stack */}
            <div className="w-full border-t-[0.53px] border-[#00000033] flex items-center justify-end pt-1">
              <AttendeeAvatars />
            </div>
          </div>

          {/* Share Event Footer Card */}
          <div className="border-[0.53px] border-[#00000033] flex flex-wrap gap-2 items-center justify-between rounded-[10px] p-4 shadow-2xs">
            <span className="text-xs font-medium text-gray-700">
              Share this event
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleShare(eventData)}
                className="p-2 border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 transition"
              >
                <Share2 size={14} />
              </button>
              <button className="p-2 border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 transition">
                <Mail size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
