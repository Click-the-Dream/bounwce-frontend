"use client";

import Image from "next/image";
import { MoreHorizontal, Share2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Event } from "@/app/_utils/types/event";
import { CustomCalendarIcon, CustomMapPinIcon } from "@/app/_utils/CustomIcons";
import Link from "next/link";

interface EventCardProps {
  event: Event;
}

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
  const handleShare = async () => {
    const shareData = {
      title: event.title,
      text: `Check out this event: ${event.title}`,
      url: `${window.location.origin}/events/${event.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Event link copied to clipboard.");
      }
    } catch (err) {
      console.error(err);
    }

    setShowMenu(false);
  };

  return (
    <div className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgba(0,0,0,0.06)] transition duration-300 flex flex-col h-full">
      {/* Event Image Banner */}
      <div className="relative w-full aspect-16/10 bg-gray-100 overflow-hidden">
        <Image
          src={event.image}
          alt={event.title}
          fill
          className="object-cover  transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Status Badge */}
        <span className="absolute top-3 left-3 bg-white/20 backdrop-blur-xs border border-white/40 text-white text-[10px] font-medium tracking-wider px-2.5 py-1 rounded-md uppercase transition-all duration-300 group-hover:bg-white/30">
          {event.status}
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
            <div className="absolute right-0 mt-1 w-max overflow-hidden rounded-[10px] border border-gray-100 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={handleShare}
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
        <h3 className="text-sm font-semibold text-gray-900 mb-2 mt-4 transition-colors duration-300 group-hover:text-[#FF5A5F] line-clamp-1">
          {event.title}
        </h3>

        {/* Event Meta Details */}
        <div className="space-x-4 mb-4 flex gap-1 flex-wrap items-center">
          <div className="flex items-center text-xs text-[#FF5A5F] font-medium gap-1">
            <CustomCalendarIcon />
            <span className="text-black">{event.date}</span>
          </div>
          <div className="flex items-center text-xs text-purple-700 font-medium gap-1">
            <CustomMapPinIcon />
            <span className="text-black">{event.location}</span>
          </div>
        </div>

        {/* Card Footer: Attendees Stack & Action */}
        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center">
            {/* Overlapping Avatar Stack */}
            <div className="flex -space-x-1.5 transition-transform duration-300 group-hover:translate-x-0.5">
              {event.attendeeAvatars.map((src, i) => (
                <div
                  key={i}
                  className="relative w-5.25 h-5.25 rounded-full border border-white overflow-hidden bg-gray-200 shrink-0"
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
            <span className="text-xs text-black">+{event.attendeesCount}</span>
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
