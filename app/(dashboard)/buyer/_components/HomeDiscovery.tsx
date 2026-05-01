"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Coffee,
  Shirt,
  Dog,
  Book,
  Palette,
  Leaf,
  Send,
} from "lucide-react";

const HomeDiscovery = () => {
  const [searchValue, setSearchValue] = useState("");
  const [liveIndex, setLiveIndex] = useState(0);

  const discoveryTags = [
    {
      label: "Artisan Coffee",
    },
    {
      label: "Local Clothing Brands",
    },
    {
      label: "Pet Grooming Nearby",
    },
    {
      label: "Book Club Meetings",
    },
    {
      label: "Artisanal Crafters",
    },
    {
      label: "Local Plants & Flowers",
    },
  ];

  // =======================
  // CLEAN INTENT SUGGESTIONS (NOT ECHOES)
  // =======================
  const suggestionBank = [
    "Find local coffee spots",
    "Discover fashion brands near me",
    "Pet grooming services nearby",
    "Upcoming book meetups",
    "Creative artisans around me",
    "Plant shops in Lagos",
  ];

  const suggestions = useMemo(() => {
    if (!searchValue) return suggestionBank.slice(0, 4);

    return suggestionBank
      .filter((item) => item.toLowerCase().includes(searchValue.toLowerCase()))
      .slice(0, 4);
  }, [searchValue]);

  // =======================
  // CLEAN LIVE FEED (structured + readable)
  // =======================
  const liveFeed = [
    {
      label: "RSVP Spike",
      text: "12 RSVPs to Detty December in the last hour",
    },
    { label: "Trending", text: "Coffee spots rising in your area" },
    { label: "New", text: "A designer just joined Bouwnce" },
    { label: "Discovery", text: "Pop-up market detected in Lekki" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveIndex((prev) => (prev + 1) % liveFeed.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const activeFeed = liveFeed[liveIndex];

  return (
    <div className="relative isolate min-h-screen bg-white flex flex-col items-center px-6 pt-24">
      {/* HERO */}
      <div className="max-w-4xl text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-6 tracking-tight leading-[1.05]">
          Find what’s happening around you
        </h1>

        <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
          Discover coffee spots, local brands, events, and services near you —
          all in one place.
        </p>
      </div>

      {/* TAGS */}
      <div className="flex flex-wrap justify-center gap-3 max-w-3xl mb-20">
        {discoveryTags.map((tag, index) => (
          <button
            key={index}
            onClick={() => setSearchValue(tag.label)}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-white/80 backdrop-blur border border-gray-300 rounded-full text-sm font-medium text-gray-800 hover:shadow-md hover:border-orange-200 transition-all"
          >
            {tag.label}
          </button>
        ))}
      </div>

      <div className="grow" />

      {/* SEARCH AREA */}
      <div className="w-full max-w-2xl pb-6 sticky bottom-2">
        {/* ================= LIVE FEED (IMPROVED) ================= */}
        <div className="mb-3 px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-3 overflow-hidden">
          <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse shrink-0" />

          <div className="flex flex-col overflow-hidden">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">
              {activeFeed.label}
            </span>

            <p className="text-xs text-gray-700 truncate animate-in fade-in slide-in-from-bottom-1">
              {activeFeed.text}
            </p>
          </div>
        </div>

        {/* ================= SUGGESTIONS ================= */}
        {searchValue.length >= 0 && (
          <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {suggestions.map((item, i) => (
              <button
                key={i}
                onClick={() => setSearchValue(item)}
                className="whitespace-nowrap px-4 py-2 rounded-full border border-gray-300 bg-white text-xs text-gray-700 hover:bg-orange-50 hover:border-orange-300 transition"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {/* ================= SEARCH ================= */}
        <div className="relative flex items-center bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 px-3 py-2 focus-within:ring-2 focus-within:ring-orange-300 transition-all">
          <div className="pl-3 text-gray-400">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Find anything..."
            className="w-full py-5 px-3 text-base text-gray-800 outline-none placeholder:text-gray-400 bg-transparent"
          />

          <button className="p-2 bg-gray-50 rounded-lg text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeDiscovery;
