"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, TrendingUp, Compass } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const suggestionPool = [
  "Smartphones under ₦200k",
  "Trending sneakers in Lagos",
  "Home office setup deals",
  "Top rated gadgets today",
  "Affordable fashion picks",
  "Best sellers near you",
];

const products = [
  "iPhone 13 Pro Max",
  "Samsung Galaxy S23 Ultra",
  "MacBook Air M2",
  "Nike Air Force 1",
  "Ergonomic Office Chair",
  "Sony WH-1000XM5 Headphones",
  "Gaming Laptop RTX 4060",
];

export default function HeroSection({ name }: { name: string }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [liveCount, setLiveCount] = useState(128);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [activeSuggestion, setActiveSuggestion] = useState<string | null>(null);

  const suggestions = useMemo(() => suggestionPool, []);

  const [pulseIndex, setPulseIndex] = useState(0);

  const pulses = useMemo(
    () => [
      "Tech deals trending upward",
      "Sneakers gaining demand in Lagos",
      "Remote work setups increasing",
      "Smartphones most viewed today",
      "Audio equipment trending",
    ],
    [],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveCount((prev) => {
        const drift = Math.floor(Math.random() * 5 - 2);
        return Math.max(90, prev + drift);
      });

      setPulseIndex((p) => (p + 1) % pulses.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [pulses.length]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    return products
      .filter((p) => p.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
  }, [query, scores]);

  const handleSelect = (item: string) => {
    setScores((prev) => ({
      ...prev,
      [item]: (prev[item] || 0) + 1,
    }));
  };

  const handleSuggestionClick = (item: string) => {
    setQuery(item);
    setActiveSuggestion(item);
    setFocused(true);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="bg-white rounded-2xl border border-gray-100 p-6 md:p-10"
    >
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* LEFT */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
            Welcome back, {name || "there"}
          </h1>

          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Compass size={14} />
            Personalized discovery experience
          </p>

          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-orange-200 opacity-60 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-300" />
            </span>

            <motion.span
              key={liveCount}
              initial={{ opacity: 0.6, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {liveCount}+ people active in marketplace
            </motion.span>
          </div>
        </div>

        {/* RIGHT */}
        <div className="hidden md:flex md:flex-col md:items-end md:max-w-55 text-xs text-gray-500 gap-1">
          <div className="flex items-center gap-2 text-green-700">
            <TrendingUp size={14} />
            <span className="whitespace-nowrap">Live market signal</span>
          </div>

          <span className="text-right leading-snug">{pulses[pulseIndex]}</span>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative mt-6 md:w-2/3">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-gray-200 focus:outline-none transition"
            placeholder="Search products, brands, categories..."
          />
        </div>

        {/* RESULTS */}
        <AnimatePresence>
          {focused && query && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute z-30 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden"
            >
              {searchResults.map((item) => (
                <div
                  key={item}
                  onClick={() => handleSelect(item)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  {item}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SUGGESTIONS */}
      <div className="mt-5">
        <div className="text-xs text-gray-500 mb-2">Suggested for you</div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {suggestions.map((item) => {
            const isActive = activeSuggestion === item;

            return (
              <button
                key={item}
                onClick={() => handleSuggestionClick(item)}
                className={`
                  flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition
                  ${
                    isActive
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }
                `}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex flex-wrap gap-3 mt-6">
        <button className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-black transition">
          Continue Shopping
        </button>

        <button className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
          Explore Categories
        </button>
      </div>
    </motion.section>
  );
}
