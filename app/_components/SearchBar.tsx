"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import CategoryList from "./CategoryList";
import { useRouter } from "next/navigation";
const SearchBar = () => {
  const router = useRouter();
  const [query, setQuery] = useState(""); // Track search input

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(query)}`);
    } else {
      router.push(`/marketplace`);
    }
  };

  return (
    <>
      <CategoryList setQuery={setQuery} />
      <div className="w-full max-w-4xl px-4 py-5">
        <div
          className="flex flex-row items-stretch md:items-center gap-2 bg-white rounded-[15px] md:rounded-[10px] p-2 md:p-1 border border-gray-200/50 transition-all duration-300"
          style={{
            boxShadow: `1px 1px 2px 0px rgba(0, 0, 0, 0.10), 3px 3px 5px 0px rgba(0, 0, 0, 0.09), 8px 7px 6px 0px rgba(0, 0, 0, 0.05), 14px 12px 7px 0px rgba(0, 0, 0, 0.01)`,
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            //onKeyDown={(e) => e.key === 'Enter' && handleSearch()} // Search on Enter key
            placeholder="Where can i get a shawarma"
            className="grow rounded-lg md:rounded-[5px] px-4 md:px-6 py-4 md:py-3 bg-[#F4F4F5] text-gray-700 outline-none placeholder:text-gray-400 font-medium text-[13px]"
          />

          <button
            onClick={handleSearch}
            className="cursor-pointer bg-[#FF5030] hover:bg-[#e4462a] text-black font-semibold px-6 md:px-7.5 py-3 md:py-3.75 rounded-lg md:rounded-[5px] border-2 border-black transition-all active:scale-[0.98] h-13 md:h-11.5 text-[14px] md:text-[13px] flex items-center justify-center"
          >
            <Search className="block lg:hidden" />
            <span className="hidden lg:block">Search</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default SearchBar;
