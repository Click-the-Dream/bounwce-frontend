"use client";

import React, { useState } from "react";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import EventCard from "./_components/EventCard";
import BackBtn from "../_components/BackBtn";

// Mock data array to fill the UI grids
const MOCK_EVENTS = Array(9).fill({
  title: "Design Summit 2026",
  date: "March 28, 2025",
  location: "O2 Arena",
  signups: "1000",
  revenue: "N300K",
  status: "UPCOMING",
  bannerUrl:
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=60",
});

export default function ManageEventsPage() {
  const [searchQuery, setSearchQuery] = useState("");

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

      {/* Filter and Count Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-medium text-gray-900 tracking-tight">
            Manage Event
          </h1>
          <span className="bg-black text-white text-xs font-medium  rounded-full flex items-center justify-center min-w-5.25 h-5.25">
            10
          </span>
        </div>

        {/* Input Bar Group Controls */}
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-[0.53px] border-[#0000004D] rounded-[10px] pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-300 transition"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#949494] text-white rounded-lg text-xs font-medium hover:bg-gray-600 transition shadow-xs cursor-pointer">
            <SlidersHorizontal size={13} strokeWidth={2.5} />
            Filter
          </button>
        </div>
      </div>

      {/* Events Presentation Responsive Layout Grid */}
      <div className="grid grid-cols-store gap-x-2.5 gap-y-8.75 pb-12 justify-center">
        {MOCK_EVENTS.map((event, index) => (
          <EventCard key={index} event={event} />
        ))}
      </div>
    </div>
  );
}
