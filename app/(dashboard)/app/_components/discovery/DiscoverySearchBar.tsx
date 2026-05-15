"use client";

import { Search, Send } from "lucide-react";
import { useEffect, useState } from "react";

interface DiscoverySearchBarProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
  handleSearch: () => void;
  interests: string[];
}

const TypingPlaceholder = ({ text }: { text: string }) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setDisplayed("");

      for (let i = 0; i <= text.length; i++) {
        if (cancelled) return;

        setDisplayed(text.slice(0, i));

        const delay = 50 + Math.random() * 80;
        await new Promise((r) => setTimeout(r, delay));
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [text]);

  return <span>{displayed}</span>;
};

export const DiscoverySearchBar = ({
  searchValue,
  setSearchValue,
  handleSearch,
  interests,
}: DiscoverySearchBarProps) => {
  const [index, setIndex] = useState(0);
  const [pool, setPool] = useState<string[]>([]);

  useEffect(() => {
    if (!interests || interests.length === 0) {
      setPool([]);
      return;
    }

    const generated = interests.flatMap((interest) => [
      `Find people interested in ${interest}`,
      `Discover ${interest} near you`,
      `Explore trending ${interest}`,
    ]);

    setPool(generated);
    setIndex(0);
  }, [interests]);

  useEffect(() => {
    if (searchValue.length > 0 || pool.length === 0) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % pool.length);
    }, 8000); // slow + readable UX

    return () => clearInterval(interval);
  }, [searchValue, pool]);

  const text = pool[index] || "";

  return (
    <div className="w-full max-w-2xl sticky bottom-4 mx-auto">
      <div className="flex items-center bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-sm">
        <Search className="w-5 h-5 text-gray-400 ml-2" />

        <div className="relative w-full">
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full px-3 py-5 outline-none bg-transparent text-sm sm:text-base relative z-10"
          />

          {searchValue.length === 0 && text && (
            <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none overflow-hidden">
              <div className="truncate">
                <TypingPlaceholder text={text} />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleSearch}
          className="cursor-pointer text-gray-400 hover:text-orange-500 transition"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
