"use client";

import Image from "next/image";
import { MoreHorizontal, Share2, Video } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { CustomCalendarIcon, CustomMapPinIcon } from "@/app/_utils/CustomIcons";
import Link from "next/link";
import { Event } from "@/app/_utils/types/event";
import SafeImage from "@/app/_components/SafeImage";
import { formatEventTime } from "@/app/_utils/date";
import { handleShare } from "@/app/_utils/formatters";
import AttendeeAvatars from "../[eventId]/_components/AttendeeAvatars";

interface EventCardProps {
  event: Event;
}

const avatars = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
];
export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check for valid image URL
  const hasValidBanner =
    event.banner_url &&
    event.banner_url !== "string" &&
    event.banner_url.trim() !== "";

  return (
    <div className="group bg-white border-[0.53px] border-[#00000033] rounded-[10px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.06)] transition duration-300 flex flex-col h-full">
      {/* Event Image Banner */}
      <div className="relative w-full aspect-16/10 bg-gray-100 overflow-hidden">
        {hasValidBanner ? (
          <SafeImage
            src={event.banner_url!}
            alt={event.name}
            width={300}
            height={200}
            className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs text-gray-600">
            No Banner
          </div>
        )}

        {/* Status Badge */}
        <span className="absolute top-3 left-3 bg-white/20 backdrop-blur-xs border border-white/40 text-white text-[10px] font-medium tracking-wider px-2.5 py-1 rounded-md uppercase transition-all duration-300 group-hover:bg-white/30">
          {event.state}
        </span>

        {/* Options Button */}
        <div ref={menuRef} className="absolute top-3 right-3">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="rounded-full p-1 text-white opacity-80 transition-all duration-300 hover:bg-white/20 hover:opacity-100"
          >
            <MoreHorizontal size={20} className="drop-shadow-sm" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-1 w-max overflow-hidden rounded-[10px] border border-gray-100 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150 z-10">
              <button
                onClick={() => {
                  handleShare(event);
                  setShowMenu(false);
                }}
                className="flex w-max items-center gap-3 px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50"
              >
                <Share2 size={16} />
                Share
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex flex-col grow">
        <h3 className="text-sm font-semibold text-gray-900 my-2 transition-colors duration-300 group-hover:text-[#FF5A5F] line-clamp-1">
          {event.name}
        </h3>

        {/* Event Meta Details */}
        <div className="space-x-4 mb-4 flex gap-1 flex-wrap items-center">
          <div className="flex items-center text-xs text-[#FF5A5F] font-medium gap-1">
            <CustomCalendarIcon />
            <span className="text-black">{formatEventTime(event.date)}</span>
          </div>
          {/* Dynamic Location Rendering */}
          {event.location_type === "physical" ? (
            <div className="flex items-center text-xs text-purple-700 font-medium gap-1">
              <CustomMapPinIcon />
              <span className="text-black capitalize line-clamp-1">
                {event.location && event.location !== "string"
                  ? event.location
                  : "Physical Event"}
              </span>
            </div>
          ) : (
            <div className="flex items-center text-xs text-blue-600 font-medium gap-1">
              <Video size={16} className="shrink-0 text-blue-500" />
              {event.link && event.link !== "string" ? (
                <Link
                  href={
                    event.link.startsWith("http")
                      ? event.link
                      : `https://${event.link}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline line-clamp-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  Virtual Event
                </Link>
              ) : (
                <span className="capitalize">Virtual Event</span>
              )}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="mt-auto border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center">
            {/* Overlapping Avatar Stack */}

            <AttendeeAvatars className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </div>

          <Link
            href={`/app/events/${event?.id}`}
            className="text-xs font-medium text-black/90 hover:text-black transition"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};
