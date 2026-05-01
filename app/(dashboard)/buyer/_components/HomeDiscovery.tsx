"use client";
import React, { useState } from "react";
import {
  Search,
  Coffee,
  Shirt,
  Dog,
  Book,
  Palette,
  Leaf,
  Music,
  Trophy,
  SlidersHorizontal,
  Send,
} from "lucide-react";

const HomeDiscovery = () => {
  const [searchValue, setSearchValue] = useState("");

  const discoveryTags = [
    {
      label: "Artisan Coffee",
      icon: <Coffee className="w-4 h-4 text-amber-700" />,
    },
    {
      label: "Local Clothing Brands",
      icon: <Shirt className="w-4 h-4 text-pink-500" />,
    },
    {
      label: "Pet Grooming Nearby",
      icon: <Dog className="w-4 h-4 text-orange-400" />,
    },
    {
      label: "Book Club Meetings",
      icon: <Book className="w-4 h-4 text-blue-600" />,
    },
    {
      label: "Artisanal Crafters",
      icon: <Palette className="w-4 h-4 text-purple-500" />,
    },
    {
      label: "Local Plants & Flowers",
      icon: <Leaf className="w-4 h-4 text-green-600" />,
    },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-6 pt-24">
      {/* Hero */}
      <div className="max-w-4xl text-center mb-14 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-6 tracking-tight leading-[1.05]">
          Discover Your Local World
        </h1>

        <p className="text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
          Bouwnce connects you with products, services, and people around you —
          effortlessly.
        </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap justify-center gap-3 max-w-3xl mb-20">
        {discoveryTags.map((tag, index) => (
          <button
            key={index}
            className="flex items-center gap-2.5 px-5 py-2.5 bg-white/80 backdrop-blur border border-gray-300 rounded-full text-sm font-medium text-gray-800 hover:shadow-md hover:border-orange-200 hover:-translate-y-[1px] transition-all"
          >
            {tag.label}
          </button>
        ))}
      </div>

      {/* Push search to bottom naturally */}
      <div className="grow" />

      {/* Bottom Search (NOT fixed anymore) */}
      <div className="w-full max-w-2xl pb-10 sticky bottom-2">
        <div className="relative flex items-center bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-orange-300">
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

      {/* Ambient BG */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-orange-100/30 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-50/40 rounded-full blur-3xl -z-10"></div>
    </div>
  );
};

export default HomeDiscovery;
