"use client";

import Image from "next/image";
import {
  Calendar,
  Clock,
  User,
  Share2,
  Mail,
  MapPin,
  ExternalLink,
  Smile,
} from "lucide-react";
import { useParams } from "next/navigation";
import useEvents from "@/app/hooks/use-events";
import EventBanner from "./EventBanner";
import { formatEventTime, formatEventDate } from "@/app/_utils/date";
import EventDetailsSkeleton from "./EventDetailsSkeleton";

const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
];

export default function EventDetailsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { useGetEvent } = useEvents();
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
                  className="px-2.5 py-1 rounded-lg text-xs text-orange bg-[#EFEFEF] font-medium capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Location Map Section */}
          <div className="mt-10 min-h-22.25">
            <h2 className="text-sm font-medium text-black">Location</h2>

            <div className="mt-7.5 border-[0.53px] border-[#00000033] rounded-[10px] overflow-hidden bg-white flex flex-col md:flex-row">
              {/* Left Placeholder Map Canvas */}
              <div className="w-full md:w-1/3  bg-gray-200 relative flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-200/60">
                <div className="flex items-center justify-center">
                  <MapPin size={20} className="text-orange" />
                </div>
              </div>

              {/* Right Address Details */}
              <div className="p-4 md:p-5 flex flex-col justify-center">
                <h3 className="text-[13px] font-semibold text-black">
                  {eventData.location}
                </h3>
                <p className="text-[13px] text-gray-500">
                  {eventData?.address}
                </p>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    `${eventData.location}`,
                  )}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs text-orange hover:underline mt-1"
                >
                  Get Direction
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section (Buy Ticket Sidebar) */}
        <div className="space-y-4">
          {/* Action Card */}
          <div className="border-[0.53px] border-[#00000033] rounded-2xl p-5 py-10 shadow-2xs space-y-4">
            <button className="w-full py-3 bg-black text-white text-xs font-semibold rounded-full hover:bg-gray-800 transition shadow-xs">
              Continue to buy ticket
            </button>

            <button className="w-full py-2.5 bg-white border border-gray-300 text-gray-800 text-xs font-medium rounded-full hover:bg-gray-50 transition flex items-center justify-center gap-2">
              <Smile size={16} className="text-gray-600" />
              See who is going
            </button>

            <hr className="border-gray-100" />

            {/* Attendees Stack */}
            <div className="absolute bottom-2 flex items-center justify-end gap-2 pt-1">
              <div className="flex -space-x-2">
                {AVATARS.map((src, i) => (
                  <div
                    key={i}
                    className="relative w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-gray-200"
                  >
                    <Image
                      src={src}
                      alt={`Attendee ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
              <span className="text-xs font-medium text-gray-600">
                +{AVATARS.length}
              </span>
            </div>
          </div>

          {/* Share Event Footer Card */}
          <div className="border-[0.53px] border-[#00000033] rounded-2xl p-5 py-10 shadow-2xs space-y-4">
            <span className="text-xs font-medium text-gray-700">
              Share this event
            </span>
            <div className="flex items-center gap-2">
              <button className="p-2 border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600 transition">
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
