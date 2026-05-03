"use client";
import { useEffect, useMemo, useState } from "react";
import { Search, Send } from "lucide-react";
import useInterest from "@/app/hooks/use-interest";

const HomeDiscovery = () => {
  const [searchValue, setSearchValue] = useState("");
  const [liveIndex, setLiveIndex] = useState(0);
  const [expandedFeed, setExpandedFeed] = useState<any>(null);
  const { useGetUserInterests } = useInterest();
  const { data: userInterests = [], isLoading: isLoadingInterests } =
    useGetUserInterests();

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

  // Enhanced Live Feed with Types
  const liveFeed = [
    {
      label: "RSVP Spike",
      text: "12 RSVPs to Detty December in the last hour",
      type: "event",
    },
    {
      label: "Trending",
      text: "Coffee spots rising in your area",
      type: "trend",
    },
    {
      label: "New Member",
      text: "A designer just joined Bouwnce",
      type: "user",
    },
    {
      label: "Discovery",
      text: "Pop-up market detected in Lekki",
      type: "discovery",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveIndex((prev) => (prev + 1) % liveFeed.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [liveFeed.length]);

  const activeFeed = liveFeed[liveIndex];

  // Helper for badge styling
  const getBadgeStyles = (type: string) => {
    switch (type) {
      case "event":
        return "bg-purple-100 text-purple-600";
      case "trend":
        return "bg-orange-100 text-orange-600";
      case "user":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-green-100 text-green-600";
    }
  };

  return (
    <div className="relative isolate min-h-screen bg-slate-50 flex flex-col items-center px-6 pt-24">
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
      <div className="flex flex-wrap justify-center gap-3 max-w-3xl mb-10">
        {userInterests.map((tag: string, index: number) => (
          <button
            key={index}
            onClick={() => setSearchValue(tag)}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-xs md:text-sm font-medium text-gray-800 hover:shadow-md hover:border-orange-200 transition-all active:scale-95"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* LIVE FEED */}
      <div
        className={`sticky  w-full max-w-2xl mb-2 ${suggestions.length > 0 ? "bottom-35" : "bottom-26"}`}
      >
        {/* COMPACT FEED BAR */}
        {!expandedFeed && (
          <div className="px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-4">
            {/* STATUS DOT */}
            <div className="flex items-center justify-center shrink-0">
              <span className="w-2 h-2 bg-orange-500 rounded-full" />
            </div>

            {/* CONTENT */}
            <div className="flex flex-col flex-1 min-w-0">
              <div key={liveIndex} className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    {activeFeed.label}
                  </span>
                  <span className="text-[10px] text-gray-400">• live</span>
                </div>

                <p className="text-sm text-gray-900 mt-1 truncate">
                  {activeFeed.text}
                </p>
              </div>
            </div>

            {/* VIEW BUTTON */}
            <button
              onClick={() => setExpandedFeed(activeFeed)}
              className="text-[11px] text-gray-500 hover:text-gray-900 transition"
            >
              View
            </button>
          </div>
        )}

        {/* ================= EXPANDED BANNER ================= */}
        {expandedFeed && (
          <div className="relative bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
            {/* HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {expandedFeed.label}
                </span>
                <span className="text-[10px] text-gray-400">live</span>
              </div>

              <button
                onClick={() => setExpandedFeed(null)}
                className="text-xs text-gray-500 hover:text-gray-900 transition"
              >
                Close
              </button>
            </div>

            {/* CONTENT */}
            <div className="px-5 py-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {expandedFeed.label}
              </h3>

              <p className="text-sm text-gray-700 leading-relaxed">
                {expandedFeed.text}
              </p>

              {/* optional enrichment block */}
              <div className="mt-5 p-4 bg-gray-50 rounded-xl text-xs text-gray-600">
                This is a live system update from Bouwnce discovery engine. More
                details, actions, or linked content can be shown here (events,
                users, listings, etc).
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setExpandedFeed(null)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grow pb-20" />

      {/* SEARCH AREA */}
      <div className="w-full max-w-2xl pb-3 sticky bottom-2">
        {/* SUGGESTIONS */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {suggestions.map((item, i) => (
            <button
              key={i}
              onClick={() => setSearchValue(item)}
              className="whitespace-nowrap px-4 py-2 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-orange-50 hover:border-orange-200 transition-all shadow-sm"
            >
              {item}
            </button>
          ))}
        </div>

        {/* SEARCH BAR */}
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
